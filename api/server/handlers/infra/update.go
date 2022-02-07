package infra

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/apierrors"
	"github.com/porter-dev/porter/api/server/shared/config"
	"github.com/porter-dev/porter/api/types"
	"github.com/porter-dev/porter/internal/models"
	"github.com/porter-dev/porter/provisioner/client"
	ptypes "github.com/porter-dev/porter/provisioner/types"
	"gorm.io/gorm"
)

type InfraUpdateHandler struct {
	handlers.PorterHandlerReadWriter
}

func NewInfraUpdateHandler(config *config.Config, decoderValidator shared.RequestDecoderValidator, writer shared.ResultWriter) *InfraUpdateHandler {
	return &InfraUpdateHandler{
		PorterHandlerReadWriter: handlers.NewDefaultPorterHandler(config, decoderValidator, writer),
	}
}

func (c *InfraUpdateHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	proj, _ := r.Context().Value(types.ProjectScope).(*models.Project)
	infra, _ := r.Context().Value(types.InfraScope).(*models.Infra)

	req := &types.RetryInfraRequest{}

	if ok := c.DecodeAndValidate(w, r, req); !ok {
		return
	}

	var cluster *models.Cluster
	var err error

	if infra.ParentClusterID != 0 {
		cluster, err = c.Repo().Cluster().ReadCluster(proj.ID, infra.ParentClusterID)

		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.HandleAPIError(w, r, apierrors.NewErrForbidden(
					fmt.Errorf("cluster with id %d not found in project %d", infra.ParentClusterID, proj.ID),
				))
			} else {
				c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
			}

			return
		}
	}

	// verify the credentials
	err = checkInfraCredentials(c.Config(), proj, infra, req.InfraCredentials)

	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrForbidden(err))
		return
	}

	// if the values are nil, get the last applied values and marshal them
	if req.Values == nil || len(req.Values) == 0 {
		lastOperation, err := c.Repo().Infra().GetLatestOperation(infra)

		if err != nil {
			c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
			return
		}

		rawValues := lastOperation.LastApplied

		err = json.Unmarshal(rawValues, &req.Values)

		if err != nil {
			c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
			return
		}
	}

	vals := req.Values

	// if this is cluster-scoped and the kind is RDS, run the postrenderer
	if infra.ParentClusterID != 0 && infra.Kind == "rds" {
		var ok bool

		pr := &InfraRDSPostrenderer{
			config: c.Config(),
		}

		if vals, ok = pr.Run(w, r, &Opts{
			Cluster: cluster,
			Values:  vals,
		}); !ok {
			return
		}
	}

	// call apply on the provisioner service
	pClient := client.NewClient("http://localhost:8082/api/v1")

	resp, err := pClient.Apply(context.Background(), proj.ID, infra.ID, &ptypes.ApplyBaseRequest{
		Kind:          string(infra.Kind),
		Values:        vals,
		OperationKind: "update",
	})

	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	c.WriteResult(w, r, resp)
}
