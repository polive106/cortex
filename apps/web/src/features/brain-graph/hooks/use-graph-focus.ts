import { useMemo, useState } from "react";
import { type GraphEdge, type GraphNode, neighbours } from "../api";

export interface GraphFocus {
  readonly query: string;
  readonly setQuery: (query: string) => void;
  readonly hovered: string | undefined;
  readonly setHovered: (id: string | undefined) => void;
  /** Nodes whose title or path matches the query, best first. */
  readonly matches: readonly string[];
  /**
   * The nodes to highlight, the rest dimmed: the hovered node and its neighbours, else the
   * matches. Undefined when nothing is focused.
   */
  readonly highlighted: ReadonlySet<string> | undefined;
}

/** Which part of the graph the user is looking at: a hovered node or a search. */
export function useGraphFocus(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): GraphFocus {
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string>();
  const links = useMemo(() => neighbours(edges), [edges]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") return [];
    const scored = nodes.flatMap((node) => {
      const title = node.title.toLowerCase();
      if (title.startsWith(needle)) return [{ id: node.id, score: 0 }];
      if (title.includes(needle) || node.id.includes(needle)) return [{ id: node.id, score: 1 }];
      return [];
    });
    return scored.sort((a, b) => a.score - b.score).map((match) => match.id);
  }, [nodes, query]);

  const highlighted = useMemo(() => {
    if (hovered) return new Set([hovered, ...(links.get(hovered) ?? [])]);
    return query.trim() === "" ? undefined : new Set(matches);
  }, [hovered, links, matches, query]);

  return { query, setQuery, hovered, setHovered, matches, highlighted };
}
