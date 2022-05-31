export type GitProvider =
  | {
      provider: "github";
      name: string;
      installation_id: number;
    }
  | {
      provider: "gitlab";
      instance_url: string;
      integration_id: number;
    };

export type GitRepository = {
  name: string;
  kind: "github" | "gitlab";
};

export type RepoStore = {
  [id: number]: GitRepository[];
};

export type BranchesStore = {
  [repoName: string]: string[];
};

export type Directory = {
  [key: string]: Directory | string;
};

export type FileDirectoryStore = {
  [branchName: string]: Directory;
};
