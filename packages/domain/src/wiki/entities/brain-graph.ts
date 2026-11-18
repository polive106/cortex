import type { WikiFile } from "../ports/wiki-store";
import { Page } from "./page";
import { PagePath } from "./page-path";
import { WikiIndex } from "./wiki-index";

/** The id of the hub node that stands for index.md. */
export const INDEX_NODE = "index.md";

export interface GraphNode {
  /** The page path, or INDEX_NODE. */
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: "index" | "page";
  /** How many edges touch this node. */
  readonly degree: number;
}

/** An undirected link between two nodes. */
export interface GraphEdge {
  readonly source: string;
  readonly target: string;
}

// Markdown links, not images: [text](href "optional title").
const LINK = /(?<!!)\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * The brain as a graph: a hub for index.md linked to every page it lists, and an edge for every
 * markdown link between two pages. Page links are relative to the linking page (the brain's
 * schema); `wiki/...` and `/wiki/...` links are read from the repo root.
 */
export class BrainGraph {
  private constructor(
    readonly nodes: readonly GraphNode[],
    readonly edges: readonly GraphEdge[],
  ) {}

  static build(indexMarkdown: string | null, files: readonly WikiFile[]): BrainGraph {
    const paths = new Set(files.map((file) => file.path));
    const edges = new Map<string, GraphEdge>();
    const degree = new Map<string, number>();
    const connect = (source: string, target: string) => {
      if (source === target || !paths.has(target)) return;
      const key = [source, target].sort().join("\n");
      if (edges.has(key)) return;
      edges.set(key, { source, target });
      for (const id of [source, target]) degree.set(id, (degree.get(id) ?? 0) + 1);
    };

    for (const entry of WikiIndex.parse(indexMarkdown ?? "").entries) {
      connect(INDEX_NODE, entry.path.value);
    }
    // Stored pages may predate PagePath's rules; those keep a node, titled by their file name.
    const pages = files.map(({ path, content }) => {
      const pagePath = PagePath.tryParse(path);
      if (pagePath) return { id: path, ...Page.parse(pagePath, content) };
      const name = path.slice(path.lastIndexOf("/") + 1, -".md".length);
      return { id: path, title: name, summary: "", body: content };
    });
    for (const { id, body } of pages) {
      for (const [, href = ""] of body.matchAll(LINK)) {
        const target = resolvePageLink(id, href);
        if (target) connect(id, target);
      }
    }

    const count = files.length;
    const nodes: GraphNode[] = [
      {
        id: INDEX_NODE,
        title: "Index",
        summary: `${count} ${count === 1 ? "article" : "articles"}`,
        kind: "index",
        degree: degree.get(INDEX_NODE) ?? 0,
      },
      ...pages.map(({ id, title, summary }) => ({
        id,
        title,
        summary,
        kind: "page" as const,
        degree: degree.get(id) ?? 0,
      })),
    ];
    return new BrainGraph(nodes, [...edges.values()]);
  }
}

/**
 * The repo path a markdown link in the file `from` points at, or undefined when it leaves the repo
 * (a scheme, a bare anchor, too many `..`). Relative links resolve from `from`; `wiki/...` and
 * `/wiki/...` from the repo root. The graph and the web reader both use it (E7-US04).
 */
export function resolvePageLink(from: string, href: string): string | undefined {
  if (SCHEME.test(href)) return undefined;
  const target = href.replace(/[#?].*$/, "");
  if (target === "") return undefined;
  const rooted = target.startsWith("/") || target.startsWith("wiki/");
  const segments = rooted ? [] : from.split("/").slice(0, -1);
  for (const segment of target.split("/")) {
    if (segment === "..") {
      if (segments.pop() === undefined) return undefined;
    } else if (segment !== "." && segment !== "") {
      segments.push(segment);
    }
  }
  return segments.join("/");
}
