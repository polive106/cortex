import { parseFrontmatter, serializeFrontmatter } from "./frontmatter";
import type { PagePath } from "./page-path";
import { oneLine } from "./text";

export interface PageProps {
  readonly path: PagePath;
  readonly title: string;
  readonly summary: string;
  /** `raw/` source paths this page draws on. */
  readonly sources: readonly string[];
  /** YYYY-MM-DD of the last ingest that touched it. */
  readonly updated: string;
  readonly body: string;
}

/** A wiki page: frontmatter (title, summary, sources, updated) and a markdown body. */
export class Page implements PageProps {
  readonly path: PagePath;
  readonly title: string;
  readonly summary: string;
  readonly sources: readonly string[];
  readonly updated: string;
  readonly body: string;

  constructor(props: PageProps) {
    this.path = props.path;
    this.title = oneLine(props.title);
    this.summary = oneLine(props.summary);
    this.sources = [...props.sources];
    this.updated = props.updated;
    this.body = props.body;
  }

  static parse(path: PagePath, markdown: string): Page {
    const { fields, body } = parseFrontmatter(markdown);
    const text = (key: string) => (typeof fields[key] === "string" ? fields[key] : "");
    const sources = fields.sources;
    return new Page({
      path,
      title: text("title") || path.slug,
      summary: text("summary"),
      sources: Array.isArray(sources) ? sources : [],
      updated: text("updated"),
      body,
    });
  }

  serialize(): string {
    return serializeFrontmatter(
      {
        title: this.title,
        summary: this.summary,
        sources: [...this.sources],
        updated: this.updated,
      },
      this.body,
    );
  }
}
