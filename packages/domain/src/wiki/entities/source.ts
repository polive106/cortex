import { serializeFrontmatter } from "./frontmatter";
import type { SourcePath } from "./source-path";
import { oneLine } from "./text";

export interface SourceProps {
  readonly path: SourcePath;
  readonly title: string;
  /** Where it came from: a URL, "pasted", or a Slack permalink. */
  readonly origin: string;
  /** YYYY-MM-DD it was captured. */
  readonly captured: string;
  readonly text: string;
}

/** An immutable original under `raw/`, kept so every page can point at its evidence. */
export class Source implements SourceProps {
  readonly path: SourcePath;
  readonly title: string;
  readonly origin: string;
  readonly captured: string;
  readonly text: string;

  constructor(props: SourceProps) {
    this.path = props.path;
    this.title = oneLine(props.title);
    this.origin = oneLine(props.origin);
    this.captured = props.captured;
    this.text = props.text;
  }

  serialize(): string {
    return serializeFrontmatter(
      { title: this.title, origin: this.origin, captured: this.captured },
      this.text,
    );
  }
}
