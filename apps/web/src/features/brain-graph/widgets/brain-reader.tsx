import { ArrowLeftIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { type CSSProperties, memo, type ReactNode } from "react";
import { type Components, Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { brainFileUrl, pageName } from "@/lib/brain-location";
import { safeRehypePlugins } from "@/lib/markdown-links";
import { safeMarkdownUrl } from "@/lib/safe-markdown-url";
import { type BrainPage, nodeSlug, READER_LINK_TAG, rehypeReaderLinks } from "../api";
import type { BrainPageStatus } from "../hooks/use-brain-page";

export interface BrainReaderProps {
  /** The test id prefix: the chat's brain panel or the `/brain` screen. */
  readonly scope: "chat" | "brain";
  /** The page to show. */
  readonly path: string | undefined;
  readonly status: BrainPageStatus;
  /** The last page loaded, which may still be the previous one while the next loads. */
  readonly page: BrainPage | undefined;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onOpenPage: (path: string) => void;
  /** Shown as a close button when given (the `/brain` screen). */
  readonly onClose?: () => void;
}

const HEADER_BUTTON = "text-neutral-300 hover:bg-white/10 hover:text-white";

// The panel is dark whatever the app's theme, so the markdown reads the dark tokens here.
const DARK_TOKENS = {
  "--foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.269 0 0)",
  "--muted-foreground": "oklch(0.708 0 0)",
  "--border": "oklch(1 0 0 / 10%)",
  "--primary": "oklch(0.922 0 0)",
  "--primary-foreground": "oklch(0.205 0 0)",
  "--background": "oklch(0.145 0 0)",
  "--card": "oklch(0.205 0 0)",
  "--accent": "oklch(0.269 0 0)",
  "--sidebar": "oklch(0.205 0 0)",
  colorScheme: "dark",
} as CSSProperties;

/**
 * A brain page as markdown, under the graph (E7-US04): props only. Links to other pages open them
 * here; other links follow the reply's URL policy, so page text can't load remote images.
 */
export function BrainReader({
  scope,
  path,
  status,
  page,
  canGoBack,
  onBack,
  onOpenPage,
  onClose,
}: BrainReaderProps) {
  const current = page?.path === path ? page : undefined;
  const title = current?.title ?? (path === undefined ? "Reader" : pageName(path));
  const githubUrl = path && brainFileUrl(path);
  return (
    <section
      aria-busy={status === "loading"}
      aria-label="Brain page"
      className="flex h-full min-h-0 flex-col bg-[#1b1b1b] text-neutral-300"
      data-path={path}
      data-status={status}
      data-testid={`${scope}-panel-reader`}
      style={DARK_TOKENS}
    >
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {canGoBack ? (
          <Button
            aria-label="Back to the previous page"
            className={HEADER_BUTTON}
            data-testid={`${scope}-btn-reader-back`}
            onClick={onBack}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ArrowLeftIcon />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1 px-1">
          <p
            className="truncate font-medium text-neutral-100 text-sm"
            data-testid={`${scope}-text-reader-title`}
          >
            {title}
          </p>
          {path ? (
            <p className="truncate text-neutral-500 text-xs">
              {path}
              {current?.updated ? ` · updated ${current.updated}` : ""}
            </p>
          ) : null}
        </div>
        {githubUrl ? (
          <Button asChild className={HEADER_BUTTON} size="icon-sm" variant="ghost">
            <a
              aria-label="Open this page on GitHub"
              data-testid={`${scope}-link-reader-github`}
              href={githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLinkIcon />
            </a>
          </Button>
        ) : null}
        {onClose ? (
          <Button
            aria-label="Close the reader"
            className={HEADER_BUTTON}
            data-testid={`${scope}-btn-reader-close`}
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
        {current ? (
          <PageBody onOpenPage={onOpenPage} page={current} scope={scope} />
        ) : (
          <p className="text-neutral-500" data-testid={`${scope}-text-reader-empty`}>
            {EMPTY_TEXT[status]}
          </p>
        )}
      </div>
    </section>
  );
}

const EMPTY_TEXT: Readonly<Record<BrainPageStatus, string>> = {
  idle: "Click a page in the graph to read it here.",
  loading: "Loading…",
  ready: "Loading…",
  missing: "This page isn't in the brain.",
  error: "Couldn't load this page.",
};

/**
 * The page's markdown. Memoised: the graph above re-renders on every layout tick and view frame,
 * and the page should be parsed again only when it, or what its links do, changes.
 */
const PageBody = memo(function PageBody({
  scope,
  page,
  onOpenPage,
}: {
  readonly scope: BrainReaderProps["scope"];
  readonly page: BrainPage;
  readonly onOpenPage: (path: string) => void;
}) {
  const PageLink = ({ path, children }: { path?: unknown; children?: ReactNode }) => {
    // Only the plugin sets `path`, to a page it resolved, after sanitizing.
    if (typeof path !== "string") return children;
    return (
      <button
        className="wrap-anywhere cursor-pointer font-medium text-[#f0b45a] underline decoration-dotted underline-offset-2 hover:text-[#ffd18a]"
        data-testid={`${scope}-btn-reader-page-${nodeSlug(path)}`}
        onClick={() => onOpenPage(path)}
        title={path}
        type="button"
      >
        {children}
      </button>
    );
  };
  return (
    <Streamdown
      className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      components={{ [READER_LINK_TAG]: PageLink } as Components}
      mode="static"
      rehypePlugins={safeRehypePlugins(rehypeReaderLinks(page.path))}
      urlTransform={safeMarkdownUrl}
    >
      {page.body}
    </Streamdown>
  );
});
