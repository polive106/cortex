import {
  type Changeset,
  type CommitResult,
  ConflictError,
  isPagePath,
  type WikiFile,
  type WikiStore,
} from "@cortex/domain";

export interface GitHubWikiStoreOptions {
  /** Fine-grained token limited to the brain repo, Contents read/write (ADR-0005). */
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly branch?: string;
  readonly apiUrl?: string;
  readonly fetch?: typeof fetch;
}

/** A failed GitHub call. The message names the method, route and status, never credentials. */
export class GitHubApiError extends Error {
  constructor(
    readonly method: string,
    readonly route: string,
    readonly status: number,
  ) {
    const hint = status === 401 || status === 403 ? " (check the token's access to the repo)" : "";
    super(`GitHub ${method} ${route} failed: ${status}${hint}`);
    this.name = "GitHubApiError";
  }
}

const READ_CONCURRENCY = 8;
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

/**
 * The brain on GitHub through the REST API. Each changeset is one commit: a tree on the current
 * head, a commit, then a fast-forward-only ref update. If the head moved, it raises
 * ConflictError and doesn't replay, so the caller re-plans on fresh content.
 */
export class GitHubWikiStore implements WikiStore {
  readonly #token: string;
  readonly #fetch: typeof fetch;
  private readonly base: string;
  private readonly branch: string;

  constructor(options: GitHubWikiStoreOptions) {
    this.#token = options.token;
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.branch = options.branch ?? "main";
    this.base = `${options.apiUrl ?? "https://api.github.com"}/repos/${options.owner}/${options.repo}`;
  }

  async readFile(path: string): Promise<string | null> {
    const response = await this.send(
      "GET",
      `/contents/${encodePath(path)}?ref=${encodeURIComponent(this.branch)}`,
      { accept: "application/vnd.github.raw+json", allow: 404 },
    );
    return response.status === 404 ? null : response.text();
  }

  async listPages(): Promise<string[]> {
    const paths = await this.treePaths(this.branch);
    return paths.filter(isPagePath).sort();
  }

  async readPages(): Promise<WikiFile[]> {
    const paths = await this.listPages();
    const files: WikiFile[] = [];
    for (let i = 0; i < paths.length; i += READ_CONCURRENCY) {
      const batch = await Promise.all(
        paths
          .slice(i, i + READ_CONCURRENCY)
          .map(async (path) => ({ path, content: await this.readFile(path) })),
      );
      for (const { path, content } of batch) if (content !== null) files.push({ path, content });
    }
    return files;
  }

  async commit(changeset: Changeset, message: string): Promise<CommitResult> {
    if (changeset.isEmpty) throw new Error("Refusing to commit an empty changeset");
    const head = (
      await this.json<{ object: { sha: string } }>("GET", `/git/ref/heads/${this.branch}`)
    ).object.sha;
    const needsCheck = changeset.files.some((file) => file.mustNotExist);
    // A commit sha works as a tree-ish, so the precondition listing needn't wait for GET commit.
    const [baseCommit, existing] = await Promise.all([
      this.json<{ tree: { sha: string } }>("GET", `/git/commits/${head}`),
      needsCheck ? this.treePaths(head) : Promise.resolve([]),
    ]);
    const clash = changeset.files.find((file) => file.mustNotExist && existing.includes(file.path));
    if (clash) throw new ConflictError(`${clash.path} already exists`);
    const baseTree = baseCommit.tree.sha;

    const tree = await this.json<{ sha: string }>("POST", "/git/trees", {
      base_tree: baseTree,
      tree: changeset.files.map(({ path, content }) => ({
        path,
        mode: "100644",
        type: "blob",
        content,
      })),
    });
    const commit = await this.json<{ sha: string }>("POST", "/git/commits", {
      message,
      tree: tree.sha,
      parents: [head],
    });
    const update = await this.send("PATCH", `/git/refs/heads/${this.branch}`, {
      body: { sha: commit.sha, force: false },
      allow: 422,
    });
    if (update.status === 422) {
      throw new ConflictError("The brain changed while committing; re-read and try again");
    }
    return { ref: commit.sha };
  }

  private async treePaths(treeish: string): Promise<string[]> {
    const listing = await this.json<{ truncated: boolean; tree: { path: string; type: string }[] }>(
      "GET",
      `/git/trees/${treeish}?recursive=1`,
    );
    if (listing.truncated) {
      throw new Error("GitHub truncated the brain's tree listing; the brain is too large to list");
    }
    return listing.tree.filter((entry) => entry.type === "blob").map((entry) => entry.path);
  }

  private async json<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.send(method, path, { body });
    return (await response.json()) as T;
  }

  private async send(
    method: string,
    path: string,
    options: { body?: unknown; accept?: string; allow?: number } = {},
  ): Promise<Response> {
    const response = await this.#fetch(`${this.base}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.#token}`,
        accept: options.accept ?? "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (!response.ok && response.status !== options.allow) {
      throw new GitHubApiError(method, path.replace(/\?.*$/, ""), response.status);
    }
    return response;
  }
}
