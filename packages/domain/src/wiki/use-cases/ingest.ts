import { Changeset } from "../entities/changeset";
import { LogEntry } from "../entities/log-entry";
import { Page } from "../entities/page";
import { PagePath } from "../entities/page-path";
import { Source } from "../entities/source";
import { SourcePath } from "../entities/source-path";
import { isoDate } from "../entities/text";
import { IndexEntry, WikiIndex } from "../entities/wiki-index";
import { ConflictError, InvalidIngestError } from "../errors";
import type { Clock } from "../ports/clock";
import type { CommitResult, WikiStore } from "../ports/wiki-store";

export interface IngestRequest {
  readonly source: { readonly title: string; readonly origin: string; readonly text: string };
  /** Pages to create or update. The body is the full new content: merge, don't append. */
  readonly pages: readonly {
    /** Defaults to the slug of the title. */
    readonly path?: string;
    readonly title: string;
    readonly summary: string;
    readonly body: string;
  }[];
}

export interface IngestResult {
  readonly ref: string;
  readonly source: string;
  /** "create wiki/…" or "update wiki/…", one per page. */
  readonly changes: readonly string[];
}

/**
 * Turns a source and its pages into one commit: the immutable raw source, created or updated
 * pages, the index line per page, and a log entry (ADR-0004). It reads the brain once, plans,
 * and commits. If the brain moved under the commit, it re-reads and re-plans once.
 */
export class Ingest {
  constructor(
    private readonly store: WikiStore,
    private readonly clock: Clock,
  ) {}

  async execute(request: IngestRequest): Promise<IngestResult> {
    try {
      return await this.attempt(request);
    } catch (error) {
      if (!(error instanceof ConflictError) || error instanceof ImmutableSourceError) throw error;
      return this.attempt(request);
    }
  }

  private async attempt(request: IngestRequest): Promise<IngestResult> {
    const now = this.clock.now();
    const today = isoDate(now);
    const source = new Source({
      path: SourcePath.forTitle(now, request.source.title),
      title: request.source.title,
      origin: request.source.origin,
      captured: today,
      text: request.source.text,
    });
    const targets = pageTargets(request);

    // One round trip: everything this ingest checks or rewrites.
    const [existingSource, indexFile, logFile, ...existingPages] = await Promise.all([
      this.store.readFile(source.path.value),
      this.store.readFile("index.md"),
      this.store.readFile("log.md"),
      ...targets.map(({ path }) => this.store.readFile(path.value)),
    ]);
    if (existingSource !== null) throw new ImmutableSourceError(source.path.value);

    const changes = targets.map(({ input, path }, i) => {
      const existing = existingPages[i] ?? null;
      const earlier = existing === null ? [] : Page.parse(path, existing).sources;
      const page = new Page({
        path,
        title: input.title,
        summary: input.summary,
        sources: [...earlier.filter((s) => s !== source.path.value), source.path.value],
        updated: today,
        body: input.body,
      });
      return { page, action: existing === null ? ("create" as const) : ("update" as const) };
    });
    const lines = changes.map(({ action, page }) => `${action} ${page.path.value}`);

    const index = changes.reduce(
      (current, { page }) => current.upsert(IndexEntry.of(page)),
      WikiIndex.parse(indexFile ?? ""),
    );
    const log = new LogEntry({
      date: today,
      operation: "ingest",
      title: source.title,
      details: [`source ${source.path.value}`, ...lines],
    }).appendTo(logFile ?? "");

    const changeset = changes
      .reduce(
        (current, { page, action }) =>
          current.write(page.path.value, page.serialize(), { mustNotExist: action === "create" }),
        new Changeset().write(source.path.value, source.serialize(), { mustNotExist: true }),
      )
      .write("index.md", index.serialize())
      .write("log.md", log);

    const { ref }: CommitResult = await this.store.commit(changeset, `ingest: ${source.title}`);
    return { ref, source: source.path.value, changes: lines };
  }
}

class ImmutableSourceError extends ConflictError {
  constructor(path: string) {
    super(`${path} already exists, and sources in raw/ are immutable`);
  }
}

function pageTargets(request: Pick<IngestRequest, "pages">) {
  if (request.pages.length === 0) throw new InvalidIngestError("An ingest needs at least one page");
  const targets = request.pages.map((input) => ({
    input,
    path: input.path !== undefined ? PagePath.parse(input.path) : PagePath.fromTitle(input.title),
  }));
  const seen = new Set<string>();
  for (const { path } of targets) {
    if (seen.has(path.value)) throw new InvalidIngestError(`${path.value} is listed twice`);
    seen.add(path.value);
  }
  return targets;
}
