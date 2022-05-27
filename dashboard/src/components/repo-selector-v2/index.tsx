import _ from "lodash";
import React from "react";
import api from "shared/api";
import { proxy } from "valtio";

type GitProvider =
  | {
      provider: "github";
      name: string;
      app_id: number;
    }
  | {
      provider: "gitlab";
      instance_url: string;
      integration_id: number;
    };

type GitRepository = {
  name: string;
  kind: "github" | "gitlab";
};

type RepoStore = {
  [id: number]: GitRepository[];
};

type BranchesStore = {
  [repoName: string]: string[];
};

type Directory = {
  [key: string]: Directory | string;
};

type FileDirectoryStore = {
  [branchName: string]: Directory;
};

class RepoSelectorStore {
  providers: GitProvider[] = [];
  repositories: RepoStore = {};
  branches: BranchesStore = {};
  files: FileDirectoryStore = {};

  currentProvider: GitProvider;
  currentRepo: GitRepository;
  currentBranch: string;

  setCurrentPovider(provider: GitProvider) {
    this.currentProvider = provider;
  }

  get providerId() {
    if (this.currentProvider.provider === "github") {
      return this.currentProvider.app_id;
    }

    return this.currentProvider.integration_id;
  }

  async loadProviders() {
    const { data } = await fakeApi<GitProvider[]>(providers);

    this.providers = data;
  }

  async loadRepositories(project_id: number) {
    try {
      let data;
      if (this.currentProvider.provider === "github") {
        const res = await api.getGitRepoList(
          "<token>",
          {},
          { project_id, git_repo_id: this.currentProvider.app_id }
        );
        data = this.parseRepoList(res.data);
      } else {
        const res = await fakeApi<GitRepository[]>(gitlabRepos);
        data = res.data;
      }

      this.repositories = {
        ...this.repositories,
        [this.providerId]: data,
      };
    } catch (error) {}
  }

  async getBranches(project_id: number) {
    try {
      const [owner, name] = this.currentRepo.name.split("/");

      const { data: branches } = await api.getBranches(
        "<token>",
        {},
        {
          project_id,
          git_repo_id: this.providerId,
          kind: "github",
          owner,
          name,
        }
      );

      this.branches = {
        ...this.branches,
        [this.currentRepo.name]: branches,
      };
    } catch (error) {}
  }

  private parseRepoList(list: any[]) {
    return list.map((item) => ({
      name: item.FullName,
      kind: item.Kind,
    })) as GitRepository[];
  }

  async getContent(path: string): Promise<Directory | string> {
    const objectPath = path.replace("/", ".");
    const fileContent = _.get(this.files[this.currentBranch], objectPath);

    // If not present go and get the content from the api and parse it
    if (!fileContent) {
      const content = await fakeContentApi(path);
      this.parseContent(path, content);
      return this.getContent(path);
    }

    return fileContent;
  }

  private parseContent = (
    path: string,
    content: { path: string; type: "file" | "dir" }[]
  ) => {
    const parsedContent = content.reduce((acc, current) => {
      const fileName = current.path.replace(path + "/", "");
      if (current.type === "file") {
        return {
          ...acc,
          [fileName]: "file",
        };
      }
      return {
        ...acc,
        [fileName]: {},
      };
    }, {});

    const objectPath = path.replace("/", ".");

    if (path === "./") {
      this.files[this.currentBranch] = parsedContent;
    } else {
      let safeCopyofStore = { ...this.files[this.currentBranch] };
      _.set(safeCopyofStore, objectPath, parsedContent);

      this.files[this.currentBranch] = safeCopyofStore;
    }
  };
}

const store = proxy(new RepoSelectorStore());

const index = () => {
  return <></>;
};

export default index;

const fakeApi = <T extends any>(data: T) =>
  new Promise<{ data: T }>((res) => setTimeout(res, 800, { data }));

const providers: GitProvider[] = [
  {
    provider: "github",
    name: "OrganizationName",
    app_id: 12390312,
  },
  {
    provider: "gitlab",
    instance_url: "https://instance.url",
    integration_id: 32,
  },
];

const gitlabRepos: GitRepository[] = [
  {
    name: "something",
    kind: "gitlab",
  },
  {
    name: "something",
    kind: "gitlab",
  },
  {
    name: "something",
    kind: "gitlab",
  },
  {
    name: "something",
    kind: "gitlab",
  },
];

const fakeContentApi = (path: string) =>
  new Promise<{ path: string; type: "file" | "dir" }[]>((res) => {
    setTimeout(res, 800, { data: contentMocks[path] });
  });

const contentMocks: {
  [key: string]: { path: string; type: "file" | "dir" }[];
} = {
  "./": [
    { path: ".dockerignore", type: "file" },
    { path: ".env.example", type: "file" },
    { path: ".eslintrc.js", type: "file" },
    { path: ".github", type: "dir" },
    { path: ".gitignore", type: "file" },
    { path: ".prettierignore", type: "file" },
    { path: "Dockerfile", type: "file" },
    { path: "README.md", type: "file" },
    { path: "app", type: "dir" },
    { path: "cypress.json", type: "file" },
    { path: "cypress", type: "dir" },
    { path: "docker-compose.yml", type: "file" },
    { path: "fly.toml", type: "file" },
    { path: "mocks", type: "dir" },
    { path: "package-lock.json", type: "file" },
    { path: "package.json", type: "file" },
    { path: "prisma", type: "dir" },
    { path: "public", type: "dir" },
    { path: "remix.config.js", type: "file" },
    { path: "remix.env.d.ts", type: "file" },
    { path: "remix.init", type: "dir" },
    { path: "server.ts", type: "file" },
    { path: "tailwind.config.js", type: "file" },
    { path: "test", type: "dir" },
    { path: "tsconfig.json", type: "file" },
    { path: "vitest.config.ts", type: "file" },
  ],
  app: [
    { path: "app/db.server.ts", type: "file" },
    { path: "app/entry.client.tsx", type: "file" },
    { path: "app/entry.server.tsx", type: "file" },
    { path: "app/models", type: "dir" },
    { path: "app/root.tsx", type: "file" },
    { path: "app/routes", type: "dir" },
    { path: "app/session.server.ts", type: "file" },
    { path: "app/utils.test.ts", type: "file" },
    { path: "app/utils.ts", type: "file" },
  ],
  "app/models": [
    { path: "app/models/note.server.ts", type: "file" },
    { path: "app/models/user.server.ts", type: "file" },
  ],
};
