import {
  GitHubWikiStore,
  HttpSourceFetcher,
  InMemorySessionIndex,
  InMemorySourceFetcher,
  InMemoryWikiStore,
  ReadOnlyWikiStore,
  TailwindArtifactBuilder,
  UpstashSessionIndex,
} from "@cortex/adapters";
import {
  type ArtifactBuilder,
  type Clock,
  FetchSource,
  Ingest,
  ListArtifacts,
  ListPages,
  ListSessions,
  PublishArtifact,
  parseBrainRepo,
  ReadArtifact,
  ReadBrainGraph,
  ReadIndex,
  ReadPage,
  RecordSessionActivity,
  RemoveSession,
  RenameSession,
  SearchWiki,
  type SessionIndex,
  type SourceFetcher,
  type WikiStore,
} from "@cortex/domain";
import { THEME_CSS } from "./lib/design-kit";
import { SAMPLE_BRAIN } from "./lib/sample-brain";
import { SAMPLE_SOURCES } from "./lib/sample-sources";
import { STARTER_BRAIN } from "./lib/starter-brain";

export interface Container {
  readonly wikiStore: WikiStore;
  readonly listPages: ListPages;
  readonly readPage: ReadPage;
  readonly searchWiki: SearchWiki;
  readonly readIndex: ReadIndex;
  readonly readBrainGraph: ReadBrainGraph;
  readonly ingest: Ingest;
  readonly sourceFetcher: SourceFetcher;
  readonly fetchSource: FetchSource;
  readonly publishArtifact: PublishArtifact;
  readonly readArtifact: ReadArtifact;
  readonly listArtifacts: ListArtifacts;
  readonly sessionIndex: SessionIndex;
  readonly recordSessionActivity: RecordSessionActivity;
  readonly listSessions: ListSessions;
  readonly renameSession: RenameSession;
  readonly removeSession: RemoveSession;
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
 * BRAIN_SEED=sample seeds the in-memory brain with a linked example brain (brain graph demos).
 * Hosted builds without GitHub settings get a read-only brain: a write would vanish
 * with the server, so it's refused instead.
 *
 * The session index (ADR-0013) is Upstash Redis with UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN set, or KV_REST_API_URL and KV_REST_API_TOKEN (the names the Vercel
 * Marketplace integration writes with the KV prefix). It's in memory otherwise, or with
 * SESSIONS_STORE=memory.
 *
 * Sources are fetched from the web (E3-US07). SOURCE_FETCHER=memory serves the sample pages
 * instead, so flow evals and E2E never reach the network.
 */
export function createContainer(env: Env, overrides: ContainerOverrides = {}): Container {
  const wikiStore = brainStore(env);
  // Artifacts compile on the design kit's theme, in-process (ADR-0012).
  const builder = overrides.builder ?? new TailwindArtifactBuilder(THEME_CSS);
  const sessionIndex = sessionStore(env);
  const sourceFetcher =
    env.SOURCE_FETCHER === "memory"
      ? new InMemorySourceFetcher(SAMPLE_SOURCES)
      : new HttpSourceFetcher();
  return {
    wikiStore,
    listPages: new ListPages(wikiStore),
    readPage: new ReadPage(wikiStore),
    searchWiki: new SearchWiki(wikiStore),
    readIndex: new ReadIndex(wikiStore),
    readBrainGraph: new ReadBrainGraph(wikiStore, systemClock),
    ingest: new Ingest(wikiStore, systemClock),
    sourceFetcher,
    fetchSource: new FetchSource(sourceFetcher),
    publishArtifact: new PublishArtifact(wikiStore, builder, systemClock),
    readArtifact: new ReadArtifact(wikiStore),
    listArtifacts: new ListArtifacts(wikiStore),
    sessionIndex,
    recordSessionActivity: new RecordSessionActivity(sessionIndex),
    listSessions: new ListSessions(sessionIndex, systemClock),
    renameSession: new RenameSession(sessionIndex),
    removeSession: new RemoveSession(sessionIndex),
  };
}

function sessionStore(env: Env): SessionIndex {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (env.SESSIONS_STORE !== "memory" && url && token) {
    return new UpstashSessionIndex({ url, token });
  }
  return new InMemorySessionIndex();
}

function brainStore(env: Env): WikiStore {
  const seed = env.BRAIN_SEED === "sample" ? SAMPLE_BRAIN : STARTER_BRAIN;
  const starter = () => new InMemoryWikiStore({ ...seed });
  if (env.BRAIN_STORE === "memory") return starter();
  const { BRAIN_GITHUB_TOKEN: token, BRAIN_REPO: repo } = env;
  if (token && repo) {
    const brain = parseBrainRepo(repo, env.BRAIN_BRANCH);
    if (!brain) throw new Error('BRAIN_REPO must be "owner/repo"');
    return new GitHubWikiStore({
      token,
      owner: brain.owner,
      repo: brain.name,
      branch: brain.branch,
    });
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
