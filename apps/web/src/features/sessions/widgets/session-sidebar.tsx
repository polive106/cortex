import { NetworkIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SessionSidebarProps {
  /** Undefined: open on wide screens and closed on small ones, by CSS alone. */
  readonly open: boolean | undefined;
  readonly status: "loading" | "ready" | "error";
  readonly error: string | undefined;
  readonly empty: boolean;
  readonly onToggle: () => void;
  /** The session rows. */
  readonly children: ReactNode;
}

/** The session list on the left of the chat (ADR-0013). Covers the chat on small screens. */
export function SessionSidebar({
  open,
  status,
  error,
  empty,
  onToggle,
  children,
}: SessionSidebarProps) {
  return (
    <>
      {open === true ? (
        // On small screens the open sidebar covers the chat; tapping beside it closes it.
        <button
          aria-label="Hide sessions"
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          data-testid="chat-btn-sessions-backdrop"
          onClick={onToggle}
          type="button"
        />
      ) : (
        <Button
          aria-label="Show sessions"
          className={cn("fixed top-3 left-14 z-30", open === undefined && "md:hidden")}
          data-testid="chat-btn-sessions-open"
          onClick={onToggle}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <PanelLeftOpenIcon />
        </Button>
      )}
      <aside
        aria-label="Sessions"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 flex-col border-r bg-background md:static md:z-auto md:w-64 md:shrink-0",
          open === undefined ? "hidden md:flex" : open ? "flex" : "hidden",
        )}
        data-testid="chat-panel-sessions"
      >
        {/* Room on the left for the account avatar, which sits fixed in the corner. */}
        <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-14">
          <span className="flex-1 truncate font-medium text-sm">Sessions</span>
          <Button asChild size="icon-sm" variant="ghost">
            <a aria-label="Brain graph" data-testid="chat-link-brain" href="/brain">
              <NetworkIcon />
            </a>
          </Button>
          <Button asChild size="icon-sm" variant="ghost">
            <a aria-label="New chat" data-testid="chat-link-sessions-new" href="/s">
              <PlusIcon />
            </a>
          </Button>
          <Button
            aria-label="Hide sessions"
            data-testid="chat-btn-sessions-close"
            onClick={onToggle}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <PanelLeftCloseIcon />
          </Button>
        </header>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {error ? (
            <p
              className="px-3 py-2 text-destructive text-xs"
              data-testid="chat-text-sessions-error"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {empty && status !== "error" ? (
            <p
              className="px-3 py-2 text-muted-foreground text-sm"
              data-testid="chat-text-sessions-empty"
            >
              {status === "loading" ? "Loading…" : "No sessions yet"}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5" data-testid="chat-list-sessions">
            {children}
          </ul>
        </nav>
      </aside>
    </>
  );
}
