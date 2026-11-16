import type { PointerEvent, RefCallback, WheelEvent } from "react";
import { pageName } from "@/lib/brain-location";
import { cn } from "@/lib/utils";
import { type GraphEdge, type GraphNode, nodeRadius, nodeSlug, type TrailStep } from "../api";
import type { Point } from "../hooks/use-force-layout";
import type { Transform } from "../hooks/use-graph-viewport";

export interface BrainGraphCanvasProps {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly positions: ReadonlyMap<string, Point>;
  readonly size: { readonly width: number; readonly height: number };
  readonly transform: Transform;
  readonly svgRef: RefCallback<SVGSVGElement>;
  /** Nodes to keep bright while the rest dim (hover or search). */
  readonly highlighted: ReadonlySet<string> | undefined;
  readonly hovered: string | undefined;
  readonly dragging: string | undefined;
  /** Nodes that just appeared, which fade in. */
  readonly fresh: ReadonlySet<string>;
  /** The agent's path through the brain, oldest first (E7-US02). */
  readonly trail: readonly TrailStep[];
  readonly onHover: (id: string | undefined) => void;
  readonly onOpen: (id: string) => void;
  readonly onWheel: (event: WheelEvent<SVGSVGElement>) => void;
  readonly onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
}

const TRAIL_COLOR = "#f0b45a";

/** The brain drawn as a dark force graph (E7-US01): props only, positions come from a hook. */
export function BrainGraphCanvas({
  nodes,
  edges,
  positions,
  size,
  transform,
  svgRef,
  highlighted,
  hovered,
  dragging,
  fresh,
  trail,
  onHover,
  onOpen,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: BrainGraphCanvasProps) {
  const trailed = new Set(trail.map((step) => step.path));
  const latest = trail.at(-1)?.path;
  const dim = (id: string) => highlighted !== undefined && !highlighted.has(id);
  // Labels shrink slower than the graph, so they stay readable zoomed out (phones).
  const text = Math.min(1.8, Math.max(1, 1 / Math.sqrt(transform.k)));
  const origin = `translate(${size.width / 2 + transform.x} ${size.height / 2 + transform.y}) scale(${transform.k})`;

  return (
    <svg
      aria-label="Brain graph"
      className={cn(
        "block h-full w-full touch-none select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      data-testid="brain-svg-graph"
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      ref={svgRef}
      role="img"
    >
      <g transform={origin}>
        <g strokeLinecap="round">
          {edges.map(({ source, target }) => {
            const a = positions.get(source);
            const b = positions.get(target);
            if (!a || !b) return null;
            const lit = hovered !== undefined && (source === hovered || target === hovered);
            const onTrail = trailed.has(source) && trailed.has(target);
            return (
              <line
                className="transition-[stroke,stroke-opacity] duration-200"
                key={`${source}|${target}`}
                stroke={onTrail ? TRAIL_COLOR : lit ? "#c8c8c8" : "#5a5a5a"}
                strokeOpacity={dim(source) || dim(target) ? 0.12 : lit || onTrail ? 0.95 : 0.75}
                strokeWidth={lit || onTrail ? 1.6 : 1}
                x1={a.x}
                x2={b.x}
                y1={a.y}
                y2={b.y}
              />
            );
          })}
        </g>
        {nodes.map((node) => {
          const point = positions.get(node.id);
          if (!point) return null;
          const radius = nodeRadius(node);
          const hub = node.kind === "index";
          const leaf = !hub && node.degree <= 1;
          const active = hovered === node.id;
          return (
            <g
              aria-label={`${node.title}${node.summary ? ` — ${node.summary}` : ""}`}
              className="cursor-pointer outline-none transition-opacity duration-200"
              data-node-id={node.id}
              data-testid={`brain-node-${nodeSlug(node.id)}`}
              key={node.id}
              onClick={() => onOpen(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpen(node.id);
              }}
              onPointerEnter={() => onHover(node.id)}
              onPointerLeave={() => onHover(undefined)}
              opacity={dim(node.id) ? 0.18 : 1}
              role="button"
              tabIndex={0}
              transform={`translate(${point.x} ${point.y})`}
            >
              <title>{node.summary ? `${node.title} — ${node.summary}` : node.title}</title>
              <g
                className={cn(fresh.has(node.id) && "fade-in zoom-in-50 animate-in duration-1000")}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {latest === node.id ? (
                  <circle
                    className="animate-pulse"
                    fill="none"
                    r={radius + 7}
                    stroke={TRAIL_COLOR}
                    strokeWidth={2}
                  />
                ) : null}
                {fresh.has(node.id) ? (
                  <circle
                    className="fade-out animate-out fill-mode-forwards delay-1000 duration-2000"
                    fill="none"
                    r={radius + 5}
                    stroke="#7ee0a1"
                    strokeWidth={2}
                  />
                ) : null}
                <circle
                  fill={hub ? "#7a7a7a" : leaf ? "#4f4f4f" : "#6c6c6c"}
                  r={radius}
                  stroke={trailed.has(node.id) ? TRAIL_COLOR : active ? "#e5e5e5" : "#2a2a2a"}
                  strokeWidth={trailed.has(node.id) || active ? 2 : 1}
                />
              </g>
              {hub ? (
                <>
                  <text
                    className="pointer-events-none"
                    dy="-0.1em"
                    fill="#f5f5f5"
                    fontSize={17}
                    fontWeight={500}
                    textAnchor="middle"
                  >
                    INDEX
                  </text>
                  <text
                    className="pointer-events-none"
                    dy="1.25em"
                    fill="#d4d4d4"
                    fontSize={11}
                    textAnchor="middle"
                    data-testid="brain-text-articles"
                  >
                    {node.summary}
                  </text>
                </>
              ) : (
                <text
                  className="pointer-events-none"
                  fill={active ? "#ffffff" : leaf ? "#8c8c8c" : "#c9c9c9"}
                  fontSize={(leaf ? 11 : 13) * text}
                  textAnchor="middle"
                  y={-radius - 7}
                >
                  {pageName(node.id)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
