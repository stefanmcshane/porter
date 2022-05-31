import React, { useContext, useEffect } from "react";
import { Context } from "shared/Context";
import { useSnapshot } from "valtio";
import { RepoStoreProvider } from "../store";
import { GitProvider } from "../types";

type Props = {
  className?: string;
};

const normalizeProviders = (providers: GitProvider[]) => {
  return providers.map((provider) => {
    if (provider.provider === "github") {
      return {
        label: provider.name,
        value: provider.installation_id,
      };
    }

    return {
      label: provider.instance_url,
      value: provider.integration_id,
    };
  });
};

const ProviderSelector = ({}: Props) => {
  const store = useSnapshot(RepoStoreProvider);

  const handleOnChange = (eventValue: string) => {
    const value = Number(eventValue);

    const selectedProviderIndex = store.providers.findIndex((provider) => {
      if (provider.provider === "github") {
        return provider.installation_id === value;
      }
      return provider.integration_id === value;
    });

    const selectedProvider = store.providers[selectedProviderIndex];
    RepoStoreProvider.setCurrentPovider(selectedProvider);
  };

  return (
    <div>
      <select
        value={store.providerId}
        onChange={(e) => handleOnChange(e.target.value)}
      >
        {normalizeProviders(store.providers).map((provider) => (
          <option value={provider.value}>{provider.label}</option>
        ))}
      </select>
    </div>
  );
};

export default ProviderSelector;
