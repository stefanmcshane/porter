import Helper from "components/form-components/Helper";
import InputRow from "components/form-components/InputRow";
import SelectRow from "components/form-components/SelectRow";
import UploadArea from "components/form-components/UploadArea";
import SaveButton from "components/SaveButton";
import { OFState } from "main/home/onboarding/state";
import {
  GCPProvisionerConfig,
  GCPRegistryConfig,
} from "main/home/onboarding/types";
import React, { useState } from "react";
import api from "shared/api";
import styled from "styled-components";
import { useSnapshot } from "valtio";
import { SharedStatus } from "./Status";

const regionOptions = [
  { value: "asia-east1", label: "asia-east1" },
  { value: "asia-east2", label: "asia-east2" },
  { value: "asia-northeast1", label: "asia-northeast1" },
  { value: "asia-northeast2", label: "asia-northeast2" },
  { value: "asia-northeast3", label: "asia-northeast3" },
  { value: "asia-south1", label: "asia-south1" },
  { value: "asia-southeast1", label: "asia-southeast1" },
  { value: "asia-southeast2", label: "asia-southeast2" },
  { value: "australia-southeast1", label: "australia-southeast1" },
  { value: "europe-north1", label: "europe-north1" },
  { value: "europe-west1", label: "europe-west1" },
  { value: "europe-west2", label: "europe-west2" },
  { value: "europe-west3", label: "europe-west3" },
  { value: "europe-west4", label: "europe-west4" },
  { value: "europe-west6", label: "europe-west6" },
  { value: "northamerica-northeast1", label: "northamerica-northeast1" },
  { value: "southamerica-east1", label: "southamerica-east1" },
  { value: "us-central1", label: "us-central1" },
  { value: "us-east1", label: "us-east1" },
  { value: "us-east4", label: "us-east4" },
  { value: "us-west1", label: "us-west1" },
  { value: "us-west2", label: "us-west2" },
  { value: "us-west3", label: "us-west3" },
  { value: "us-west4", label: "us-west4" },
];

export const CredentialsForm: React.FC<{
  nextFormStep: (data: Partial<GCPRegistryConfig>) => void;
  project: any;
}> = ({ nextFormStep, project }) => {
  const [projectId, setProjectId] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [region, setRegion] = useState("us-east1");
  const [buttonStatus, setButtonStatus] = useState("");

  const validate = () => {
    if (!projectId) {
      return { hasError: true, error: "Project ID cannot be empty" };
    }

    if (!serviceAccountKey) {
      return { hasError: true, error: "GCP Key Data cannot be empty" };
    }
    return {
      hasError: false,
      error: "",
    };
  };

  const submit = async () => {
    const validation = validate();

    if (validation.hasError) {
      setButtonStatus(validation.error);
      return;
    }
    setButtonStatus("loading");
    try {
      const gcpIntegration = await api
        .createGCPIntegration(
          "<token>",
          {
            gcp_region: region,
            gcp_key_data: serviceAccountKey,
            gcp_project_id: projectId,
          },
          { project_id: project.id }
        )
        .then((res) => res.data);

      nextFormStep({
        credentials: {
          id: gcpIntegration?.id,
        },
      });
    } catch (error) {
      setButtonStatus("Something went wrong, please try again");
    }
  };
  return (
    <>
      <InputRow
        type="text"
        value={projectId}
        setValue={(x: string) => {
          setProjectId(x);
        }}
        label="🏷️ GCP Project ID"
        placeholder="ex: blindfold-ceiling-24601"
        width="100%"
        isRequired={true}
      />

      <Helper>Service account credentials for GCP permissions.</Helper>
      <UploadArea
        setValue={(x: any) => setServiceAccountKey(x)}
        label="🔒 GCP Key Data (JSON)"
        placeholder="Choose a file or drag it here."
        width="100%"
        height="100%"
        isRequired={true}
      />
      <SelectRow
        options={regionOptions}
        width="100%"
        value={region}
        dropdownMaxHeight="240px"
        setActiveValue={(x: string) => {
          setRegion(x);
        }}
        label="📍 GCP Region"
      />

      <SaveButton
        text="Continue"
        disabled={false}
        onClick={submit}
        makeFlush={true}
        clearPosition={true}
        status={buttonStatus}
        statusPosition={"right"}
      />
    </>
  );
};

export const SettingsForm: React.FC<{
  nextFormStep: (data: Partial<GCPProvisionerConfig>) => void;
  project: any;
}> = ({ nextFormStep, project }) => {
  const [clusterName, setClusterName] = useState("");
  const [buttonStatus, setButtonStatus] = useState("");
  const snap = useSnapshot(OFState);

  const validate = () => {
    if (!clusterName) {
      return {
        hasError: true,
        error: "Cluster Name cannot be empty",
      };
    }

    return { hasError: false, error: "" };
  };

  const catchError = (error: any) => {
    console.error(error);
  };

  const submit = async () => {
    const validation = validate();

    if (validation.hasError) {
      setButtonStatus(validation.error);
      return;
    }

    setButtonStatus("loading");
    const integrationId = snap.StateHandler.provision_resources.credentials.id;

    if (snap.StateHandler.connected_registry.skip) {
      // await provisionGCR(integrationId);
      console.log("PROVISIONING REGISTRY");
    }
    // await provisionGKE(integrationId);
    nextFormStep({
      settings: {
        cluster_name: clusterName,
      },
    });
  };

  const provisionGCR = (id: number) => {
    console.log("Provisioning GCR");

    return api
      .createGCR(
        "<token>",
        {
          gcp_integration_id: id,
        },
        { project_id: project.id }
      )
      .catch(catchError);
  };

  const provisionGKE = (id: number) => {
    console.log("Provisioning GKE");

    return api
      .createGKE(
        "<token>",
        {
          gke_name: clusterName,
          gcp_integration_id: id,
        },
        { project_id: project.id }
      )
      .catch(catchError);
  };

  return (
    <>
      <InputRow
        type="text"
        value={clusterName}
        setValue={(x: string) => {
          setClusterName(x);
        }}
        label="Cluster Name"
        placeholder="ex: porter-cluster"
        width="100%"
        isRequired={true}
      />
      <SaveButton
        text="Continue"
        disabled={false}
        onClick={submit}
        makeFlush={true}
        clearPosition={true}
        status={buttonStatus}
        statusPosition={"right"}
      />
    </>
  );
};

export const Status: React.FC<{
  nextFormStep: () => void;
  project: any;
}> = ({ nextFormStep, project }) => {
  return <SharedStatus
    nextFormStep={nextFormStep}
    project={project}
    filter={["gke", "gcr"]}
  />
};

const CodeBlock = styled.span`
  display: inline-block;
  background-color: #1b1d26;
  color: white;
  border-radius: 5px;
  font-family: monospace;
  padding: 2px 3px;
  margin-top: -2px;
  user-select: text;
`;
