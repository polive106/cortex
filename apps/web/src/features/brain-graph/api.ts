import { type GraphEdge, type GraphNode, INDEX_NODE } from "@cortex/domain";
import { pageSlug } from "@/lib/brain-location";

export { type GraphEdge, type GraphNode, INDEX_NODE };

export interface BrainGraphData {
  /** The brain's head commit the graph was built from. */
  readonly ref: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

/** One step of the agent through the brain: a page it touched (E7-US02). */
export interface TrailStep {
  readonly path: string;
}

/** The companion route behind the graph (agents/companion/agent/channels/brain.ts). */
export const brainGraphUrl = (agent: string) => `/eve/${agent}/brain/graph`;

/** "wiki/team/on-call.md" → "team-on-call", "index.md" → "index", for `brain-node-<slug>`. */
export const nodeSlug = (id: string) => (id === INDEX_NODE ? "index" : pageSlug(id));

const isNode = (value: unknown): value is GraphNode => {
  const node = value as Record<string, unknown> | null;
  return (
    typeof node === "object" &&
    node !== null &&
    ["id", "title", "summary"].every((key) => typeof node[key] === "string") &&
    (node.kind === "index" || node.kind === "page") &&
    typeof node.degree === "number"
  );
};

const isEdge = (value: unknown): value is GraphEdge => {
  const edge = value as Record<string, unknown> | null;
  return typeof edge?.source === "string" && typeof edge.target === "string";
};

/** The well-formed graph in a `GET /brain/graph` body; edges to unknown nodes are dropped. */
export function parseBrainGraph(body: unknown): BrainGraphData | undefined {
  const data = body as { ref?: unknown; nodes?: unknown; edges?: unknown } | null;
  if (typeof data?.ref !== "string" || !Array.isArray(data.nodes)) return undefined;
  const nodes = data.nodes.filter(isNode);
  const ids = new Set(nodes.map((node) => node.id));
  const edges = (Array.isArray(data.edges) ? data.edges : [])
    .filter(isEdge)
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    .map(({ source, target }) => ({ source, target }));
  return { ref: data.ref, nodes, edges };
}

/** Each node's neighbours. */
export function neighbours(edges: readonly GraphEdge[]): ReadonlyMap<string, ReadonlySet<string>> {
  const map = new Map<string, Set<string>>();
  const add = (from: string, to: string) => {
    const set = map.get(from) ?? new Set<string>();
    set.add(to);
    map.set(from, set);
  };
  for (const { source, target } of edges) {
    add(source, target);
    add(target, source);
  }
  return map;
}

/** A node's radius: the hub is largest; pages grow with their links. */
export const nodeRadius = (node: Pick<GraphNode, "kind" | "degree">) =>
  node.kind === "index" ? 30 : 5 + Math.min(node.degree, 6) * 1.6;
