import React, { useEffect } from "react";
import styled from "styled-components";
import { useSnapshot } from "valtio";
import { derive, devtools } from "valtio/utils";
import BranchSelector from "./branch-selector/BranchSelector";
import FolderSelector from "./folder-selector/FolderSelector";
import RepoSelector from "./repo-selector/RepoSelector";
import { RepoSelectorStoreType, RepoStoreProvider } from "./store";
import { RepoStore } from "./types";

devtools(RepoStoreProvider, "repo-selector-store");

enum ACTION_CONFIG_FORM_STEPS {
  SELECT_REPO,
  SELECT_BRANCH,
  SELECT_FOLDER,
}

const getStep = (store: RepoSelectorStoreType) => {
  if (store.currentBranch) {
    return ACTION_CONFIG_FORM_STEPS.SELECT_FOLDER;
  }

  if (store.currentRepo) {
    return ACTION_CONFIG_FORM_STEPS.SELECT_BRANCH;
  }

  return ACTION_CONFIG_FORM_STEPS.SELECT_REPO;
};

const StepStore = derive({
  current_step: (get) => getStep(get(RepoStoreProvider)),
});

const Index = () => {
  const store = useSnapshot(StepStore);

  const { current_step } = store;

  useEffect(() => {
    return () => {
      RepoStoreProvider.clear();
    };
  }, []);

  switch (current_step) {
    case ACTION_CONFIG_FORM_STEPS.SELECT_REPO:
      return (
        <>
          <RepoSelector />
        </>
      );
    case ACTION_CONFIG_FORM_STEPS.SELECT_BRANCH:
      return (
        <>
          <BranchSelector />
          <PrevStepButton
            onClick={() => {
              RepoStoreProvider.currentRepo = null;
            }}
          >
            <i className="material-icons">keyboard_backspace</i>Select Repo
          </PrevStepButton>
        </>
      );
    case ACTION_CONFIG_FORM_STEPS.SELECT_FOLDER:
      return (
        <>
          <FolderSelector />
          <PrevStepButton
            onClick={() => {
              RepoStoreProvider.currentBranch = "";
            }}
          >
            <i className="material-icons">keyboard_backspace</i>Select branch
          </PrevStepButton>
        </>
      );
    default:
      return <>Step error, please start the deployment again.</>;
  }
};

export default Index;

const PrevStepButton = styled.button`
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: justify;
  justify-content: space-between;
  margin-top: 22px;
  cursor: pointer;
  font-size: 13px;
  height: 35px;
  padding: 5px 15px 5px 13px;
  margin-bottom: -7px;
  border: 1px solid rgba(255, 255, 255, 0.333);
  border-radius: 100px;
  width: 145px;
  color: white;

  background: rgba(255, 255, 255, 0.067);

  :hover {
    background: #ffffff22;
  }

  > i {
    color: white;
    font-size: 16px;
    margin-right: 6px;
  }
`;
