import type { WikiStore } from "../ports/wiki-store";

export interface BrainIndex {
  /** The brain's AGENTS.md: how pages are written. */
  readonly schema: string;
  /** index.md, possibly truncated with a notice. */
  readonly index: string;
  readonly truncated: boolean;
}

/** The always-on context for every turn: the brain's schema and its page index. */
export class ReadIndex {
  constructor(
    private readonly store: WikiStore,
    private readonly maxIndexChars = 12_000,
  ) {}

  async execute(): Promise<BrainIndex> {
    const [schema = "", full = ""] = (
      await Promise.all([this.store.readFile("AGENTS.md"), this.store.readFile("index.md")])
    ).map((file) => file ?? "");
    if (full.length <= this.maxIndexChars) return { schema, index: full, truncated: false };
    const cut = full.slice(0, this.maxIndexChars);
    const lineEnd = cut.lastIndexOf("\n");
    const kept = lineEnd > 0 ? cut.slice(0, lineEnd) : cut;
    const notice = `[index truncated: ${full.length - kept.length} more characters. Use search_wiki to find pages not listed here.]`;
    return { schema, index: `${kept}\n…\n${notice}`, truncated: true };
  }
}
