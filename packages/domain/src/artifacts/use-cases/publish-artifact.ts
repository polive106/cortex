import { Changeset } from "../../wiki/entities/changeset";
import { LogEntry } from "../../wiki/entities/log-entry";
import { isoDate } from "../../wiki/entities/text";
import { ConflictError } from "../../wiki/errors";
import type { Clock } from "../../wiki/ports/clock";
import type { WikiStore } from "../../wiki/ports/wiki-store";
import { Artifact } from "../entities/artifact";
import { ArtifactPath } from "../entities/artifact-path";
import type { ArtifactBuilder } from "../ports/artifact-builder";

export interface PublishArtifactRequest {
  readonly slug: string;
  /** Groups the artifact under `out/<project>/`. */
  readonly project?: string;
  readonly title: string;
  /** The page as the agent wrote it. A previously published page is accepted too. */
  readonly source: string;
}

export interface PublishArtifactResult {
  readonly path: string;
  readonly title: string;
  readonly version: number;
  /** The commit that holds this version; absent when nothing changed (the file is current). */
  readonly ref?: string;
  /** False when the page matched the latest version, so nothing was committed. */
  readonly changed: boolean;
}

/**
 * Publishes the next version of an artifact (ADR-0012): the self-contained page and a log entry
 * as one commit. It validates and builds the CSS once, then reads, plans and commits; if the
 * brain moved under the commit, it re-reads and re-plans once.
 */
export class PublishArtifact {
  constructor(
    private readonly store: WikiStore,
    private readonly builder: ArtifactBuilder,
    private readonly clock: Clock,
  ) {}

  async execute(request: PublishArtifactRequest): Promise<PublishArtifactResult> {
    const path = ArtifactPath.of(request.slug, request.project);
    // Validates and normalizes the source before any I/O, as version 1; each attempt re-versions it.
    const draft = Artifact.create({
      path,
      title: request.title,
      version: 1,
      source: request.source,
    });
    // Built only when the page changed, and once even when a conflict re-plans.
    let built: Promise<string> | undefined;
    const css = () => {
      built ??= this.builder.css(draft.source);
      return built;
    };
    try {
      return await this.attempt(draft, css);
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      return this.attempt(draft, css);
    }
  }

  private async attempt(
    draft: Artifact,
    css: () => Promise<string>,
  ): Promise<PublishArtifactResult> {
    const { path, title, source } = draft;
    const [existingFile, logFile] = await Promise.all([
      this.store.readFile(path.value),
      this.store.readFile("log.md"),
    ]);
    const existing = existingFile === null ? undefined : Artifact.parse(path, existingFile);
    if (existing && existing.version > 0 && existing.source === source) {
      return { path: path.value, title, version: existing.version, changed: false };
    }

    const version = (existing?.version ?? 0) + 1;
    const html = draft.withVersion(version).render(await css());
    const log = new LogEntry({
      date: isoDate(this.clock.now()),
      operation: "publish",
      title,
      details: [`${path.value} v${version}`],
    }).appendTo(logFile ?? "");
    const changeset = new Changeset()
      .write(path.value, html, { mustNotExist: existing === undefined })
      .write("log.md", log);
    const { ref } = await this.store.commit(changeset, `artifact: ${title} v${version}`);
    return { path: path.value, title, version, ref, changed: true };
  }
}
