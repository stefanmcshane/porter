import React, { useContext, useEffect, useState } from "react";
import { Context } from "shared/Context";
import { useSnapshot } from "valtio";
import { RepoStoreProvider } from "../store";
import BranchList from "./BranchList";

const BranchSelector = () => {
  const store = useSnapshot(RepoStoreProvider);
  const { currentProject } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    RepoStoreProvider.loadBranches(currentProject.id).then(() => {
      setIsLoading(false);
    });
  }, [store.currentRepo]);

  if (isLoading) {
    return <>Loading ...</>;
  }

  return (
    <>
      <BranchList />
    </>
  );
};

export default BranchSelector;
