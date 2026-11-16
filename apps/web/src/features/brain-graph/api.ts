import { type GraphEdge, type GraphNode, INDEX_NODE, PagePath } from "@cortex/domain";
import type { EveMessage } from "eve/react";
import { pageSlug } from "@/lib/brain-location";

export { type GraphEdge, type GraphNode, INDEX_NODE };

export interface BrainGraphData {
  /** The brain's head commit the graph was built from. */
  readonly ref: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export type TrailAction = "read" | "search" | "write";

/** One step of the agent through the brain: a page it read, found, or wrote (E7-US02). */
export interface TrailStep {
  /** Stable per step, so a hop animates once. */
  readonly id: string;
  readonly path: string;
  readonly action: TrailAction;
  /** The call is still running. */
  readonly active: boolean;
}

/** One colour per action, shared by the hops, the rings and the legend. */
export const TRAIL_COLORS: Readonly<Record<TrailAction, string>> = {
  read: "#f0b45a",
  search: "#6cb6ff",
  write: "#7ee0a1",
};

/** How many search hits become steps: the top ones are what the agent looks at. */
const SEARCH_STEPS = 3;

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pagePaths = (values: readonly unknown[]): string[] =>
  values.flatMap((value) => {
    const path = typeof value === "string" ? PagePath.tryParse(value)?.value : undefined;
    return path ? [path] : [];
  });

/** The agent's path through the brain, and the commit of its latest write. */
export interface BrainTrail {
  readonly steps: readonly TrailStep[];
  /** The ref `write_page` returned last: the graph should catch up to it. */
  readonly written: string | undefined;
}

/**
 * The agent's path through the brain from the conversation's brain tool calls, oldest first
 * (E7-US02). A read shows as soon as it starts; searches and writes once they're done.
 */
export function brainTrail(messages: readonly EveMessage[]): BrainTrail {
  const steps: TrailStep[] = [];
  let written: string | undefined;
  const add = (callId: string, paths: readonly string[], action: TrailAction, active = false) => {
    for (const path of paths) {
      const last = steps.at(-1);
      // The same thing done to the same page twice in a row is one step, keeping its first id.
      if (last?.path === path && last.action === action) {
        steps[steps.length - 1] = { ...last, active };
        continue;
      }
      steps.push({ id: `${callId}:${path}`, path, action, active });
    }
  };
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "tool" || part.state === "streaming") continue;
      const done = part.state === "completed";
      const output = record(part.output);
      if (output.error !== undefined) continue;
      if (part.name === "read_page") {
        add(part.callId, pagePaths([record(part.input).path]), "read", !done);
      } else if (part.name === "search_wiki" && done) {
        const hits = pagePaths(list(output.results).map((hit) => record(hit).path));
        add(part.callId, hits.slice(0, SEARCH_STEPS), "search");
      } else if (part.name === "write_page" && done) {
        // Ingest reports each page as "create wiki/x.md" or "update wiki/x.md".
        add(
          part.callId,
          pagePaths(list(output.changes).map((c) => String(c).split(" ")[1])),
          "write",
        );
        if (typeof output.ref === "string") written = output.ref;
      }
    }
  }
  return { steps, written };
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
