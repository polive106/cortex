import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useCallback, useEffect, useRef, useState } from "react";
import { type GraphEdge, type GraphNode, neighbours, nodeRadius } from "../api";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ForceLayout {
  /** Where each node is, with the index hub at the origin. */
  readonly positions: ReadonlyMap<string, Point>;
  /** Holds a node at a point (while it's dragged) and lets the rest settle around it. */
  readonly pin: (id: string, point: Point) => void;
  /** Lets a dragged node go. */
  readonly release: (id: string) => void;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  radius: number;
  hub: boolean;
}

type SimLink = SimulationLinkDatum<SimNode> & { leaf: boolean };

/** Ticks run before the first paint, so the graph appears settled instead of exploding. */
const WARM_UP_TICKS = 300;

const snapshot = (nodes: readonly SimNode[]): ReadonlyMap<string, Point> =>
  new Map(nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));

/**
 * A force-directed layout of the graph (d3-force, ADR-0015). When the graph changes, nodes keep
 * their places and new ones start next to a neighbour, so a live update eases in instead of
 * reshuffling everything.
 */
export function useForceLayout(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): ForceLayout {
  const [positions, setPositions] = useState<ReadonlyMap<string, Point>>(new Map());
  const simulation = useRef<Simulation<SimNode, SimLink> | undefined>(undefined);
  const placed = useRef(new Map<string, SimNode>());

  useEffect(() => {
    const previous = placed.current;
    const degree = new Map(nodes.map((node) => [node.id, node.degree]));
    const links = neighbours(edges);
    const next = nodes.map((node, i): SimNode => {
      const known = previous.get(node.id);
      const sim: SimNode = known ?? { id: node.id, radius: 0, hub: false };
      sim.radius = nodeRadius(node);
      sim.hub = node.kind === "index";
      if (sim.hub) {
        sim.fx = 0;
        sim.fy = 0;
      } else if (!known && previous.size > 0) {
        // Start next to a neighbour that's already placed.
        const placedNeighbour = [...(links.get(node.id) ?? [])].find((id) => previous.has(id));
        const anchor = placedNeighbour ? previous.get(placedNeighbour) : undefined;
        const angle = i * 2.4;
        sim.x = (anchor?.x ?? 0) + Math.cos(angle) * 30;
        sim.y = (anchor?.y ?? 0) + Math.sin(angle) * 30;
      }
      return sim;
    });
    placed.current = new Map(next.map((node) => [node.id, node]));

    const simLinks: SimLink[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      leaf: (degree.get(edge.source) ?? 0) <= 1 || (degree.get(edge.target) ?? 0) <= 1,
    }));
    const hubLink = (link: SimLink) => (link.source as SimNode).hub || (link.target as SimNode).hub;

    simulation.current?.stop();
    const sim = forceSimulation(next)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance((link) => (hubLink(link) ? 220 : link.leaf ? 90 : 130))
          .strength((link) => (hubLink(link) ? 0.15 : 0.6)),
      )
      .force("charge", forceManyBody<SimNode>().strength(-420).distanceMax(700))
      .force(
        "collide",
        forceCollide<SimNode>((node) => node.radius + 18),
      )
      .force("x", forceX<SimNode>(0).strength(0.02))
      .force("y", forceY<SimNode>(0).strength(0.03))
      .stop();
    // Manual ticks don't fire "tick"; only the animated ones (live updates, drags) do.
    sim.on("tick", () => setPositions(snapshot(next)));
    simulation.current = sim;

    if (previous.size === 0) {
      sim.tick(WARM_UP_TICKS);
      setPositions(snapshot(next));
    } else {
      sim.alpha(0.5).restart();
    }
    return () => {
      sim.stop();
    };
  }, [nodes, edges]);

  const pin = useCallback((id: string, point: Point) => {
    const node = placed.current.get(id);
    const sim = simulation.current;
    if (!node || node.hub || !sim) return;
    node.fx = point.x;
    node.fy = point.y;
    sim.alphaTarget(0.3).restart();
  }, []);

  const release = useCallback((id: string) => {
    const node = placed.current.get(id);
    if (!node || node.hub) return;
    node.fx = null;
    node.fy = null;
    simulation.current?.alphaTarget(0);
  }, []);

  return { positions, pin, release };
}
