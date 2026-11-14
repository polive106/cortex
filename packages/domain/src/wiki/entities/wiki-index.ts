import { PagePath } from "./page-path";
import { oneLine } from "./text";

const ENTRY = /^- \[(.*)\]\((.+)\) — (.*)$/;

export interface IndexEntryProps {
  readonly path: PagePath;
  readonly title: string;
  readonly summary: string;
}

/** One line of `index.md`: `- [Title](wiki/page.md) — one-line summary`. */
export class IndexEntry implements IndexEntryProps {
  readonly path: PagePath;
  readonly title: string;
  readonly summary: string;

  constructor(props: IndexEntryProps) {
    this.path = props.path;
    this.title = oneLine(props.title).replace(/\[/g, "(").replace(/\]/g, ")");
    this.summary = oneLine(props.summary);
  }

  static tryParse(line: string): IndexEntry | undefined {
    const match = ENTRY.exec(line);
    if (!match) return undefined;
    const [, title = "", path = "", summary = ""] = match;
    const pagePath = PagePath.tryParse(path); // a link outside wiki/ isn't a page entry
    return pagePath && new IndexEntry({ path: pagePath, title, summary });
  }

  /** The index line for a page, from its own path, title and summary. */
  static of(page: IndexEntryProps): IndexEntry {
    return new IndexEntry(page);
  }

  line(): string {
    return `- [${this.title}](${this.path.value}) — ${this.summary}`;
  }
}

/** A line of index.md; `entry` is set when the line is a page entry. */
interface Line {
  readonly text: string;
  readonly entry?: IndexEntry;
}

/** `index.md`: entry lines in order, with any other lines (headings, notes) kept as they are. */
export class WikiIndex {
  private constructor(private readonly lines: readonly Line[]) {}

  static parse(markdown: string): WikiIndex {
    const body = markdown.endsWith("\n") ? markdown.slice(0, -1) : markdown;
    const raw = body === "" ? [] : body.split("\n");
    return new WikiIndex(raw.map((text) => ({ text, entry: IndexEntry.tryParse(text) })));
  }

  get entries(): IndexEntry[] {
    return this.lines.flatMap((line) => (line.entry ? [line.entry] : []));
  }

  /** Replaces the page's line in place, or appends it after the last entry. */
  upsert(entry: IndexEntry): WikiIndex {
    const line = { text: entry.line(), entry };
    const lines = [...this.lines];
    const existing = lines.findIndex((other) => other.entry?.path.equals(entry.path));
    if (existing !== -1) {
      lines[existing] = line;
      return new WikiIndex(lines);
    }
    const lastEntry = lines.findLastIndex((other) => other.entry !== undefined);
    const lastText = lines.findLastIndex((other) => other.text.trim() !== "");
    lines.splice((lastEntry === -1 ? lastText : lastEntry) + 1, 0, line);
    return new WikiIndex(lines);
  }

  serialize(): string {
    return this.lines.length === 0 ? "" : `${this.lines.map((line) => line.text).join("\n")}\n`;
  }
}
