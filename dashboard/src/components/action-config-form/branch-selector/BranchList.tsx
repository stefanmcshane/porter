import React from "react";
import { useSnapshot } from "valtio";
import { RepoStoreProvider } from "../store";

const BranchList = () => {
  const store = useSnapshot(RepoStoreProvider);

  const { branches } = store;

  const curr_branches = branches[store.currentRepo?.name];

  if (!Array.isArray(curr_branches)) {
    return <>No branches found for this repo</>;
  }

  return (
    <div>
      {curr_branches.map((branch) => {
        return (
          <div onClick={() => (RepoStoreProvider.currentBranch = branch)}>
            {branch}
          </div>
        );
      })}
    </div>
  );
};

export default BranchList;
