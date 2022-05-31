import React, { useContext, useEffect, useState } from "react";
import { Context } from "shared/Context";
import { useSnapshot } from "valtio";
import ProviderSelector from "./ProviderSelector";
import RepoList from "./RepoList";
import { RepoStoreProvider } from "../store";
import DynamicLink from "components/DynamicLink";

const RepoSelector = () => {
  const { currentProject } = useContext(Context);
  const store = useSnapshot(RepoStoreProvider);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [needsAuthorization, setNeedsAuthorization] = useState(false);

  useEffect(() => {
    setIsLoadingProviders(true);
    RepoStoreProvider.loadProviders(currentProject.id).then(() => {
      setIsLoadingProviders(false);
    });
  }, [currentProject]);

  useEffect(() => {
    setIsLoadingRepos(true);
    setNeedsAuthorization(false);
    RepoStoreProvider.loadRepositories(currentProject.id)
      .catch((error) => {
        if (error?.response?.status === 401) {
          setNeedsAuthorization(true);
        }
      })
      .finally(() => {
        setIsLoadingRepos(false);
      });
  }, [store.currentProvider]);

  if (isLoadingProviders) {
    return <>Loading ...</>;
  }

  const getGitConnectUrl = () => {
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

    const encoded_redirect_uri = encodeURIComponent(url);

    const backendUrl = `${window.location.protocol}//${window.location.host}`;

    return {
      to: `${backendUrl}/api/projects/${currentProject.id}/oauth/gitlab?integration_id=${store.providerId}&redirect_uri=${encoded_redirect_uri}`,
      target: "_self",
    };
  };

  return (
    <div>
      <ProviderSelector />
      {!isLoadingRepos ? (
        needsAuthorization ? (
          <DynamicLink {...getGitConnectUrl()}>
            Connect gitlab account
          </DynamicLink>
        ) : (
          <>
            <RepoList />
          </>
        )
      ) : (
        "Loading Repositories..."
      )}
      {/* CONTINUE BUTTON */}
    </div>
  );
};

export default RepoSelector;
