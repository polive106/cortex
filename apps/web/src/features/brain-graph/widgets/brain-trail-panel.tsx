import { Maximize2Icon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TRAIL_COLORS, type TrailAction } from "../api";

export interface BrainTrailPanelProps {
  /** How many pages the agent has touched in this conversation. */
  readonly steps: number;
  /** Kept mounted but out of sight, so the graph survives being closed. */
  readonly hidden: boolean;
  readonly onClose: () => void;
  /** The graph. */
  readonly children: ReactNode;
}

const HEADER_BUTTON = "text-neutral-300 hover:bg-white/10 hover:text-white";

const LEGEND: readonly [TrailAction, string][] = [
  ["read", "read"],
  ["search", "found"],
  ["write", "wrote"],
];

/**
 * The brain beside the chat, showing the agent's path through it (E7-US02). Covers the chat on
 * small screens, like the artifact preview.
 */
export function BrainTrailPanel({ steps, hidden, onClose, children }: BrainTrailPanelProps) {
  return (
    <aside
      aria-label="Brain"
      className="fixed inset-0 z-40 flex flex-col data-[hidden=true]:hidden bg-[#1b1b1b] text-neutral-300 lg:static lg:z-auto lg:w-[40%] lg:max-w-[760px] lg:shrink-0 lg:border-l lg:border-white/10"
      data-hidden={hidden}
      data-testid="chat-panel-brain"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-white/10 border-b px-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-100 text-sm">Brain</p>
          <p className="truncate text-neutral-500 text-xs" data-testid="chat-text-brain-steps">
            {steps} {steps === 1 ? "step" : "steps"} this conversation
          </p>
        </div>
        <ul className="hidden items-center gap-3 text-xs sm:flex">
          {LEGEND.map(([action, label]) => (
            <li className="flex items-center gap-1.5" key={action}>
              <span className="size-2 rounded-full" style={{ background: TRAIL_COLORS[action] }} />
              {label}
            </li>
          ))}
        </ul>
        <Button asChild className={HEADER_BUTTON} size="icon-sm" variant="ghost">
          <a
            aria-label="Open the full brain graph"
            data-testid="chat-link-brain-full"
            href="/brain"
            rel="noopener"
            target="_blank"
          >
            <Maximize2Icon />
          </a>
        </Button>
        <Button
          aria-label="Hide the brain"
          className={HEADER_BUTTON}
          data-testid="chat-btn-brain-close"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </aside>
  );
}
