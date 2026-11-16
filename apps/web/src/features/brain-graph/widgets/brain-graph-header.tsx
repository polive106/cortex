import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BrainGraphHeaderProps {
  readonly status: "loading" | "ready" | "error";
  readonly error: string | undefined;
  readonly pages: number;
  readonly links: number;
  /** The head commit shown, if loaded. */
  readonly graphRef: string | undefined;
  readonly query: string;
  readonly matches: number;
  readonly onQuery: (query: string) => void;
  /** Enter in the search box: focus the best match. */
  readonly onSubmit: () => void;
}

/** The bar over the graph: back to chat, counts, live status, and search. */
export function BrainGraphHeader({
  status,
  error,
  pages,
  links,
  graphRef,
  query,
  matches,
  onQuery,
  onSubmit,
}: BrainGraphHeaderProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 p-3 pl-14 text-neutral-300">
      <Button
        asChild
        className="pointer-events-auto text-neutral-300 hover:bg-white/10 hover:text-white"
        size="sm"
        variant="ghost"
      >
        <a data-testid="brain-link-chat" href="/">
          <ArrowLeftIcon />
          Chat
        </a>
      </Button>
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="font-medium text-neutral-100 text-sm">Brain</h1>
        <span className="text-neutral-400 text-xs tabular-nums" data-testid="brain-text-count">
          {pages} {pages === 1 ? "page" : "pages"} · {links} {links === 1 ? "link" : "links"}
        </span>
        <span
          className="flex items-center gap-1.5 text-neutral-400 text-xs"
          data-testid="brain-text-status"
          title={error}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              status === "ready" && "animate-pulse bg-emerald-400",
              status === "loading" && "bg-neutral-500",
              status === "error" && "bg-red-400",
            )}
          />
          {status === "error" ? "offline" : status === "loading" ? "loading" : "live"}
          {graphRef ? (
            <code className="text-neutral-500">
              {/^[0-9a-f]{40}$/.test(graphRef) ? graphRef.slice(0, 7) : graphRef}
            </code>
          ) : null}
        </span>
      </div>
      <form
        className="pointer-events-auto relative ml-auto w-full sm:w-64"
        onSubmit={submit}
        role="search"
      >
        <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-3.5 text-neutral-500" />
        <input
          aria-label="Find a page"
          className="h-8 w-full rounded-md border border-white/10 bg-white/5 pr-14 pl-8 text-neutral-100 text-sm outline-none placeholder:text-neutral-500 focus:border-white/30"
          data-testid="brain-input-search"
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Find a page"
          type="search"
          value={query}
        />
        {query.trim() ? (
          <span
            className="-translate-y-1/2 absolute top-1/2 right-2.5 text-neutral-500 text-xs tabular-nums"
            data-testid="brain-text-matches"
          >
            {matches}
          </span>
        ) : null}
      </form>
    </header>
  );
}
