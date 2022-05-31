import React, { useEffect, useState } from "react";
import { Context } from "shared/Context";
import { useSnapshot } from "valtio";
import { RepoStoreProvider } from "../store";

const FolderSelector = () => {
  const store = useSnapshot(RepoStoreProvider);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    RepoStoreProvider.initFolder().then(() => {
      setIsLoading(false);
    });
  }, [store.currentBranch]);

  const files = Object.entries(store.filesOnFolder || {});
  if (isLoading) {
    return <>Loading ...</>;
  }

  return (
    <>
      <div>
        Current folder:{" "}
        {store.folderLocation === "" ? "./" : store.folderLocation}
      </div>

      {store.folderLocation !== "" ? (
        <div onClick={() => RepoStoreProvider.selectPath("..")}>..</div>
      ) : null}
      {store.folderHasError ? (
        "We couldn't get the content of this folder"
      ) : (
        <>
          {files.map(([key, value]) => {
            return (
              <div onClick={() => RepoStoreProvider.selectPath(key)} key={key}>
                {key}
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

export default FolderSelector;
