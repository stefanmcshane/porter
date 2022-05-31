import React, { useContext, useEffect, useState } from "react";
import { Context } from "shared/Context";
import { useSnapshot } from "valtio";
import ProviderSelector from "./ProviderSelector";
import RepoList from "./RepoList";
import { RepoStoreProvider } from "../store";

const RepoSelector = () => {
  const { currentProject } = useContext(Context);
  const store = useSnapshot(RepoStoreProvider);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);

  useEffect(() => {
    setIsLoadingProviders(true);
    RepoStoreProvider.loadProviders(currentProject.id).then(() => {
      setIsLoadingProviders(false);
    });
  }, [currentProject]);

  useEffect(() => {
    setIsLoadingRepos(true);
    RepoStoreProvider.loadRepositories(currentProject.id).then(() => {
      setIsLoadingRepos(false);
    });
  }, [store.currentProvider]);

  if (isLoadingProviders) {
    return <>Loading ...</>;
  }

  return (
    <div>
      <ProviderSelector />
      {!isLoadingRepos ? (
        <>
          <RepoList />
        </>
      ) : (
        "Loading Repositories..."
      )}
      {/* CONTINUE BUTTON */}
    </div>
  );
};

export default RepoSelector;
