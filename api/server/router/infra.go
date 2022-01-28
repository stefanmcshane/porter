package router

import (
	"fmt"

	"github.com/go-chi/chi"
	"github.com/porter-dev/porter/api/server/handlers/infra"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/config"
	"github.com/porter-dev/porter/api/types"
)

func NewInfraScopedRegisterer(children ...*Registerer) *Registerer {
	return &Registerer{
		GetRoutes: GetInfraScopedRoutes,
		Children:  children,
	}
}

func GetInfraScopedRoutes(
	r chi.Router,
	config *config.Config,
	basePath *types.Path,
	factory shared.APIEndpointFactory,
	children ...*Registerer,
) []*Route {
	routes, projPath := getInfraRoutes(r, config, basePath, factory)

	if len(children) > 0 {
		r.Route(projPath.RelativePath, func(r chi.Router) {
			for _, child := range children {
				childRoutes := child.GetRoutes(r, config, basePath, factory, child.Children...)

				routes = append(routes, childRoutes...)
			}
		})
	}

	return routes
}

func getInfraRoutes(
	r chi.Router,
	config *config.Config,
	basePath *types.Path,
	factory shared.APIEndpointFactory,
) ([]*Route, *types.Path) {
	relPath := "/infras/{infra_id}"

	newPath := &types.Path{
		Parent:       basePath,
		RelativePath: relPath,
	}

	routes := make([]*Route, 0)

	// GET /api/projects/{project_id}/infra -> project.NewInfraListHandler
	listInfraEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: "/infra",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
			},
		},
	)

	listInfraHandler := infra.NewInfraListHandler(
		config,
		factory.GetDecoderValidator(),
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: listInfraEndpoint,
		Handler:  listInfraHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id} -> infra.NewInfraGetHandler
	getEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath,
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	getHandler := infra.NewInfraGetHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getEndpoint,
		Handler:  getHandler,
		Router:   r,
	})

	// POST /api/projects/{project_id}/infras/{infra_id}/retry_create -> infra.NewInfraRetryHandler
	retryCreateEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbUpdate,
			Method: types.HTTPVerbPost,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/retry_create",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	retryCreateHandler := infra.NewInfraRetryCreateHandler(
		config,
		factory.GetDecoderValidator(),
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: retryCreateEndpoint,
		Handler:  retryCreateHandler,
		Router:   r,
	})

	// POST /api/projects/{project_id}/infras/{infra_id}/update -> infra.NewInfraUpdateHandler
	updateEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbUpdate,
			Method: types.HTTPVerbPost,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/update",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	updateHandler := infra.NewInfraUpdateHandler(
		config,
		factory.GetDecoderValidator(),
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: updateEndpoint,
		Handler:  updateHandler,
		Router:   r,
	})

	// POST /api/projects/{project_id}/infras/{infra_id}/retry_delete -> infra.NewInfraRetryDeleteHandler
	retryDeleteEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbUpdate,
			Method: types.HTTPVerbPost,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/retry_delete",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	retryDeleteHandler := infra.NewInfraRetryDeleteHandler(
		config,
		factory.GetDecoderValidator(),
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: retryDeleteEndpoint,
		Handler:  retryDeleteHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/operations -> infra.NewInfraListOperationsHandler
	listOperationsEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbList,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/operations",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	listOperationsHandler := infra.NewInfraListOperationsHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: listOperationsEndpoint,
		Handler:  listOperationsHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/operations/{operation_id} -> infra.NewInfraGetOperationHandler
	getOperationEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: fmt.Sprintf("%s/operations/{%s}", relPath, types.URLParamOperationID),
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
				types.OperationScope,
			},
		},
	)

	getOperationHandler := infra.NewInfraGetOperationHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getOperationEndpoint,
		Handler:  getOperationHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/operations/{operation_id}/logs -> infra.NewInfraGetOperationLogsHandler
	getOperationLogsEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: fmt.Sprintf("%s/operations/{%s}/logs", relPath, types.URLParamOperationID),
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
				types.OperationScope,
			},
		},
	)

	getOperationLogsHandler := infra.NewInfraGetOperationLogsHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getOperationLogsEndpoint,
		Handler:  getOperationLogsHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/logs -> infra.NewInfraStreamLogsHandler
	// streamLogsEndpoint := factory.NewAPIEndpoint(
	// 	&types.APIRequestMetadata{
	// 		Verb:   types.APIVerbGet,
	// 		Method: types.HTTPVerbGet,
	// 		Path: &types.Path{
	// 			Parent:       basePath,
	// 			RelativePath: relPath + "/logs",
	// 		},
	// 		Scopes: []types.PermissionScope{
	// 			types.UserScope,
	// 			types.ProjectScope,
	// 			types.InfraScope,
	// 		},
	// 		IsWebsocket: true,
	// 	},
	// )

	// streamLogsHandler := infra.NewInfraStreamLogsHandler(
	// 	config,
	// 	factory.GetResultWriter(),
	// )

	// routes = append(routes, &Route{
	// 	Endpoint: streamLogsEndpoint,
	// 	Handler:  streamLogsHandler,
	// 	Router:   r,
	// })

	// GET /api/projects/{project_id}/infras/{infra_id}/current -> infra.NewInfraGetHandler
	getCurrentEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/current",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	getCurrentHandler := infra.NewInfraGetCurrentHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getCurrentEndpoint,
		Handler:  getCurrentHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/desired -> infra.NewInfraGetHandler
	getDesiredEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/desired",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	getDesiredHandler := infra.NewInfraGetDesiredHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getDesiredEndpoint,
		Handler:  getDesiredHandler,
		Router:   r,
	})

	// GET /api/projects/{project_id}/infras/{infra_id}/state -> infra.NewInfraGetStateHandler
	getStateEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbGet,
			Method: types.HTTPVerbGet,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath + "/state",
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	getStateHandler := infra.NewInfraGetStateHandler(
		config,
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: getStateEndpoint,
		Handler:  getStateHandler,
		Router:   r,
	})

	// DELETE /api/projects/{project_id}/infras/{infra_id} -> infra.NewInfraDeleteHandler
	deleteEndpoint := factory.NewAPIEndpoint(
		&types.APIRequestMetadata{
			Verb:   types.APIVerbDelete,
			Method: types.HTTPVerbDelete,
			Path: &types.Path{
				Parent:       basePath,
				RelativePath: relPath,
			},
			Scopes: []types.PermissionScope{
				types.UserScope,
				types.ProjectScope,
				types.InfraScope,
			},
		},
	)

	deleteHandler := infra.NewInfraDeleteHandler(
		config,
		factory.GetDecoderValidator(),
		factory.GetResultWriter(),
	)

	routes = append(routes, &Route{
		Endpoint: deleteEndpoint,
		Handler:  deleteHandler,
		Router:   r,
	})

	return routes, newPath
}
