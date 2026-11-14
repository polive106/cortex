/** Base class for wiki failures. Messages are safe and readable for the model and for people. */
export class WikiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidPathError extends WikiError {
  constructor(
    readonly path: string,
    reason: string,
  ) {
    super(`Invalid path "${path}": ${reason}`);
  }
}

export class PageNotFoundError extends WikiError {
  constructor(readonly path: string) {
    super(`No page at ${path}`);
  }
}

export class SourceFetchError extends WikiError {
  constructor(url: string, reason: string) {
    super(`Could not fetch ${url}: ${reason}`);
  }
}

/** The brain changed underneath us, or a write would break an invariant (immutable raw/). */
export class ConflictError extends WikiError {}

/** The brain can't take writes here (for example, not connected to GitHub yet). Not retried. */
export class ReadOnlyBrainError extends WikiError {}

/** The ingest request itself is malformed (no pages, a page listed twice). */
export class InvalidIngestError extends WikiError {}
