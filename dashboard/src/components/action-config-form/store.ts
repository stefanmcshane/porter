import { cloneDeep, get, isEmpty, set } from "lodash";
import api from "shared/api";
import { proxy } from "valtio";
import { devtools } from "valtio/utils";
import {
  BranchesStore,
  FileDirectoryStore,
  GitProvider,
  GitRepository,
  RepoStore,
} from "./types";

class RepoSelectorStore {
  providers: GitProvider[] = [];
  repositories: RepoStore = {};
  branches: BranchesStore = {};
  files: FileDirectoryStore = {};

  currentProvider: GitProvider;
  currentRepo: GitRepository;
  currentBranch: string;

  folderLocation: string = "";
  filePath: string = "";
  folderHasError: boolean = false;

  setCurrentPovider(provider: GitProvider) {
    this.currentProvider = provider;
  }

  get providerId() {
    if (!this.currentProvider) {
      return NaN;
    }

    if (this.currentProvider.provider === "github") {
      return this.currentProvider.installation_id;
    }

    return this.currentProvider.integration_id;
  }

  async loadProviders(project_id: number) {
    const { data } = await api.getGitProviders<GitProvider[]>(
      "<token>",
      {},
      { project_id }
    );

    this.providers = data;
    if (!this.currentProvider) {
      this.currentProvider = data[0];
    }
  }

  async loadRepositories(project_id: number) {
    try {
      let data: GitRepository[];
      if (this.currentProvider.provider === "github") {
        const res = await api.getGitRepoList(
          "<token>",
          {},
          { project_id, git_repo_id: this.currentProvider.installation_id }
        );
        data = this.parseRepoList(res.data);
      } else {
        const res = await api.getGitlabRepos<string[]>(
          "<token>",
          {},
          { project_id, integration_id: this.providerId }
        );
        data = res.data.map((repo) => ({ name: repo, kind: "gitlab" }));
      }

      this.repositories = {
        ...cloneDeep(this.repositories),
        [this.providerId]: data,
      };
    } catch (error) {
      throw error;
    }
  }

  async loadBranches(project_id: number) {
    try {
      const [owner, name] = this.currentRepo.name.split("/");
      let data: string[];
      if (this.currentProvider.provider === "github") {
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
        data = branches;
      } else {
        const { data: branches } = await api.getGitlabBranches(
          "<token>",
          {},
          {
            project_id,
            integration_id: this.providerId,
            repo_owner: owner,
            repo_name: name,
          }
        );
        data = branches;
      }

      this.branches = {
        ...this.branches,
        [this.currentRepo.name]: data || [],
      };
    } catch (error) {}
  }

  private parseRepoList(list: any[]) {
    return list.map((item) => ({
      name: item.FullName,
      kind: item.Kind,
    })) as GitRepository[];
  }

  private parseContent(
    path: string,
    content: { path: string; type: "file" | "dir" }[]
  ) {
    const parsedContent: any = content.reduce((acc, current) => {
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
    const tmpPath = path;
    const objectPath = tmpPath.replace("/", ".");
    if (path === "./") {
      this.files = {
        ...this.files,
        [this.currentBranch]: parsedContent,
      };
    } else {
      let safeCopyofStore = cloneDeep(this.files[this.currentBranch]);
      set(safeCopyofStore, objectPath, parsedContent);

      this.files[this.currentBranch] = safeCopyofStore;
    }
    return;
  }

  private async getContent(dir: string) {
    const [owner, name] = this.currentRepo.name.split("/");

    return api.getGitlabFolderContent(
      "<token>",
      { dir },
      {
        project_id: 1,
        integration_id: this.providerId,
        branch: this.currentBranch,
        repo_name: name,
        repo_owner: owner,
      }
    );
  }

  async initFolder() {
    const { data: newContent } = await this.getContent("./");
    this.parseContent("./", newContent);
  }

  private getFolderStatus(newPath: string) {
    const path = this.folderLocation;
    const files = this.files[this.currentBranch];
    const folder = path === "" ? files : get(files, path.replace("/", "."));
    if (typeof folder === "string") {
      return {
        isFolder: false,
      };
    }

    const file = folder[newPath];

    if (typeof file === "string") {
      return {
        isFolder: false,
      };
    }

    return {
      isFolder: true,
      hasContent: !isEmpty(file),
    };
  }

  selectPath(newPath: string) {
    this.folderHasError = false;
    if (newPath === "..") {
      const [, ...path] = this.folderLocation.split("/").reverse();
      const prevPath = path.reverse().join("/");
      this.folderLocation = prevPath;
      console.log(prevPath);
      return;
    }

    const folderStatus = this.getFolderStatus(newPath);

    if (folderStatus.isFolder) {
      let newFolderLocation = newPath;
      if (this.folderLocation.length) {
        newFolderLocation = this.folderLocation + "/" + newPath;
      }
      if (!folderStatus.hasContent) {
        this.loadContent(newFolderLocation);
      }
      this.folderLocation = newFolderLocation;
    } else {
      this.filePath = this.folderLocation + "/" + newPath;
    }
  }

  async loadContent(folderLocation: string) {
    try {
      const { data: newContent } = await this.getContent(folderLocation);
      this.parseContent(folderLocation, newContent);
    } catch (error) {
      this.folderHasError = true;
    }
  }

  get filesOnFolder() {
    const files = this.files[this.currentBranch];
    if (this.folderLocation === "") {
      return files;
    }

    const path = this.folderLocation.replace("/", ".");
    return get(files, path);
  }

  clear() {
    this.providers = [];
    this.repositories = {};
    this.branches = {};
    this.files = {};

    this.currentProvider = null;
    this.currentRepo = null;
    this.currentBranch = "";

    this.folderLocation = "";
    this.filePath = "";
    this.folderHasError = false;
  }
}

export type RepoSelectorStoreType = RepoSelectorStore;

export const RepoStoreProvider = proxy(new RepoSelectorStore());

const fakeApi = <T extends any>(data: T) =>
  new Promise<{ data: T }>((res) => setTimeout(res, 800, { data }));

const providers: GitProvider[] = [
  {
    provider: "github",
    name: "OrganizationName",
    installation_id: 12390312,
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
  new Promise<{ data: { path: string; type: "file" | "dir" }[] }>((res) => {
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
