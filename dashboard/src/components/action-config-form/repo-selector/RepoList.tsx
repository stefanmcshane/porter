import React from "react";
import { useSnapshot } from "valtio";
import { RepoStoreProvider } from "../store";

const RepoList = () => {
  const store = useSnapshot(RepoStoreProvider);

  const repos = store.repositories[store.providerId];

  return (
    <div>
      {Array.isArray(repos) ? (
        repos.map((repo) => (
          <>
            <div
              key={repo.name}
              onClick={() => {
                // MOVE TO AN ACTION
                RepoStoreProvider.currentRepo = repo;
              }}
            >
              {/* Use kind to display github/gitlab icon */}
              {repo.kind} - {repo.name}
            </div>
          </>
        ))
      ) : (
        <>
          {/* HERE WE SHOULD LINK TO OAUTH FLOW */}
          We couldn't get any repositories
        </>
      )}
    </div>
  );
};

export default RepoList;
