import { HttpResponse, http } from "msw";

type Tree = Map<string, string>;

/**
 * A stateful fake of the slice of the GitHub REST API that GitHubWikiStore uses: contents,
 * recursive trees, tree and commit creation, and fast-forward-only ref updates. Tests use it
 * with msw, never the real GitHub (ADR-0007).
 */
export class FakeGitHub {
  readonly api = "https://api.github.test";
  readonly calls: string[] = [];
  /** Simulates another writer: before the next N ref updates, the head moves to a new commit. */
  headMovesFor = 0;
  private readonly trees = new Map<string, Tree>();
  private readonly commits = new Map<string, { tree: string; parents: string[] }>();
  private head: string;
  private nextId = 1;

  constructor(
    readonly token: string,
    seed: Record<string, string>,
    readonly owner = "polive106",
    readonly repo = "brain",
    readonly branch = "main",
  ) {
    const tree = this.storeTree(new Map(Object.entries(seed)));
    this.head = this.storeCommit(tree, []);
  }

  get files(): Record<string, string> {
    return Object.fromEntries(this.treeOf(this.head));
  }

  handlers() {
    const base = `${this.api}/repos/${this.owner}/${this.repo}`;
    const guard = (request: Request) => {
      this.calls.push(
        `${request.method} ${new URL(request.url).pathname.replace(`/repos/${this.owner}/${this.repo}`, "")}`,
      );
      return request.headers.get("authorization") === `Bearer ${this.token}`
        ? undefined
        : HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    };
    return [
      http.get(`${base}/contents/*`, ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        const path = decodeURIComponent(
          new URL(request.url).pathname.slice(`/repos/${this.owner}/${this.repo}/contents/`.length),
        );
        const content = this.treeOf(this.head).get(path);
        return content === undefined
          ? HttpResponse.json({ message: "Not Found" }, { status: 404 })
          : HttpResponse.text(content);
      }),
      http.get(`${base}/git/ref/heads/:branch`, ({ request }) => {
        return guard(request) ?? HttpResponse.json({ object: { sha: this.head } });
      }),
      http.get(`${base}/git/commits/:sha`, ({ request, params }) => {
        const commit = this.commits.get(String(params.sha));
        return (
          guard(request) ??
          (commit
            ? HttpResponse.json({ sha: params.sha, tree: { sha: commit.tree } })
            : HttpResponse.json({ message: "Not Found" }, { status: 404 }))
        );
      }),
      http.get(`${base}/git/trees/:ref`, ({ request, params }) => {
        const denied = guard(request);
        if (denied) return denied;
        const ref = String(params.ref);
        const tree = this.trees.get(ref) ?? this.treeOf(ref === this.branch ? this.head : ref);
        return HttpResponse.json({
          truncated: false,
          tree: [...tree.keys()].map((path) => ({ path, type: "blob" })),
        });
      }),
      http.post(`${base}/git/trees`, async ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        const body = (await request.json()) as {
          base_tree: string;
          tree: { path: string; content: string }[];
        };
        const next = new Map(this.trees.get(body.base_tree));
        for (const { path, content } of body.tree) next.set(path, content);
        return HttpResponse.json({ sha: this.storeTree(next) }, { status: 201 });
      }),
      http.post(`${base}/git/commits`, async ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        const body = (await request.json()) as { tree: string; parents: string[] };
        return HttpResponse.json(
          { sha: this.storeCommit(body.tree, body.parents) },
          { status: 201 },
        );
      }),
      http.patch(`${base}/git/refs/heads/:branch`, async ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        if (this.headMovesFor > 0) {
          this.headMovesFor--;
          this.head = this.storeCommit(this.commits.get(this.head)?.tree as string, [this.head]);
        }
        const { sha } = (await request.json()) as { sha: string };
        if (!this.commits.get(sha)?.parents.includes(this.head)) {
          return HttpResponse.json({ message: "Update is not a fast forward" }, { status: 422 });
        }
        this.head = sha;
        return HttpResponse.json({ object: { sha } });
      }),
    ];
  }

  private treeOf(commitSha: string): Tree {
    return this.trees.get(this.commits.get(commitSha)?.tree as string) as Tree;
  }

  private storeTree(tree: Tree): string {
    const sha = `tree${this.nextId++}`;
    this.trees.set(sha, tree);
    return sha;
  }

  private storeCommit(tree: string, parents: string[]): string {
    const sha = `commit${this.nextId++}`;
    this.commits.set(sha, { tree, parents });
    return sha;
  }
}
