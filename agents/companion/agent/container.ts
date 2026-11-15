import {
  GitHubWikiStore,
  InMemoryWikiStore,
  ReadOnlyWikiStore,
  TailwindArtifactBuilder,
} from "@cortex/adapters";
import {
  type ArtifactBuilder,
  type Clock,
  Ingest,
  ListArtifacts,
  ListPages,
  PublishArtifact,
  ReadArtifact,
  ReadIndex,
  ReadPage,
  SearchWiki,
  type WikiStore,
} from "@cortex/domain";
import { THEME_CSS } from "./lib/design-kit";
import { STARTER_BRAIN } from "./lib/starter-brain";

export interface Container {
  readonly wikiStore: WikiStore;
  readonly listPages: ListPages;
  readonly readPage: ReadPage;
  readonly searchWiki: SearchWiki;
  readonly readIndex: ReadIndex;
  readonly ingest: Ingest;
  readonly publishArtifact: PublishArtifact;
  readonly readArtifact: ReadArtifact;
  readonly listArtifacts: ListArtifacts;
}

/** Test seams: anything not given is built from the environment. */
export interface ContainerOverrides {
  readonly builder?: ArtifactBuilder;
}

type Env = Readonly<Record<string, string | undefined>>;

const systemClock: Clock = { now: () => new Date() };

/**
 * Composition root (ADR-0002): the only place that reads the environment. With BRAIN_GITHUB_TOKEN
 * and BRAIN_REPO ("owner/repo") set, the brain is the GitHub repo (ADR-0005). Otherwise it's an
 * in-memory brain seeded with the starter files, which lasts as long as the server process.
 * BRAIN_STORE=memory forces the in-memory brain, so flow evals and E2E never touch the real repo.
 * Hosted builds without GitHub settings get a read-only brain: a write would vanish
 * with the server, so it's refused instead.
 */
export function createContainer(env: Env, overrides: ContainerOverrides = {}): Container {
  const wikiStore = brainStore(env);
  // Artifacts compile on the design kit's theme, in-process (ADR-0012).
  const builder = overrides.builder ?? new TailwindArtifactBuilder(THEME_CSS);
  return {
    wikiStore,
    listPages: new ListPages(wikiStore),
    readPage: new ReadPage(wikiStore),
    searchWiki: new SearchWiki(wikiStore),
    readIndex: new ReadIndex(wikiStore),
    ingest: new Ingest(wikiStore, systemClock),
    publishArtifact: new PublishArtifact(wikiStore, builder, systemClock),
    readArtifact: new ReadArtifact(wikiStore),
    listArtifacts: new ListArtifacts(wikiStore),
  };
}

function brainStore(env: Env): WikiStore {
  const starter = () => new InMemoryWikiStore({ ...STARTER_BRAIN });
  if (env.BRAIN_STORE === "memory") return starter();
  const { BRAIN_GITHUB_TOKEN: token, BRAIN_REPO: repo } = env;
  if (token && repo) {
    const [owner, name, ...rest] = repo.split("/");
    if (!owner || !name || rest.length > 0) throw new Error('BRAIN_REPO must be "owner/repo"');
    return new GitHubWikiStore({ token, owner, repo: name, branch: env.BRAIN_BRANCH || "main" });
  }
  const hosted = env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
  return hosted
    ? new ReadOnlyWikiStore(starter(), "The brain isn't connected to GitHub yet")
    : starter();
}

let current: Container | undefined;

/** The process-wide container, built on first use. */
export function container(): Container {
  current ??= createContainer(process.env);
  return current;
}

/** Swap the container (tests). Pass undefined to rebuild from the environment next time. */
export function useContainer(next: Container | undefined): void {
  current = next;
}
