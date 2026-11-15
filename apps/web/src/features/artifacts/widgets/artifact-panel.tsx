import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArtifactVersion } from "../api";
import type { ArtifactHtml } from "../hooks/use-artifact-html";

export interface ArtifactPanelProps {
  readonly versions: readonly ArtifactVersion[];
  readonly selected: ArtifactVersion;
  readonly page: ArtifactHtml;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
}

/**
 * The preview beside the chat (ADR-0012). The page runs in an opaque-origin sandbox: scripts
 * yes, the app's cookies, storage and DOM never (no allow-same-origin, ever).
 */
export function ArtifactPanel({ versions, selected, page, onSelect, onClose }: ArtifactPanelProps) {
  const severalArtifacts = versions.some((v) => v.path !== selected.path);
  return (
    <aside
      aria-label="Artifact preview"
      className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto lg:w-[48%] lg:max-w-[960px] lg:shrink-0 lg:border-l"
      data-testid="chat-panel-artifact"
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm" data-testid="chat-text-artifact-title">
            {selected.title}
          </p>
          <p className="truncate text-muted-foreground text-xs">{selected.path}</p>
        </div>
        {/* Native on purpose: the OS picker on phones, where the panel covers the chat. */}
        <select
          aria-label="Version"
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          data-testid="chat-select-artifact-version"
          onChange={(event) => onSelect(event.currentTarget.value)}
          value={selected.id}
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {severalArtifacts ? `${version.title} · v${version.version}` : `v${version.version}`}
            </option>
          ))}
        </select>
        <Button
          aria-label="Close preview"
          data-testid="chat-btn-artifact-close"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </header>
      <div className="relative min-h-0 flex-1 bg-background">
        {page.status === "ready" ? (
          <iframe
            className="size-full border-0"
            data-testid="chat-frame-artifact"
            sandbox="allow-scripts"
            srcDoc={page.html}
            title={`${selected.title} v${selected.version}`}
          />
        ) : (
          <p
            className="p-6 text-muted-foreground text-sm"
            data-testid="chat-text-artifact-status"
            role={page.status === "error" ? "alert" : "status"}
          >
            {page.status === "error" ? page.error : "Loading the artifact…"}
          </p>
        )}
      </div>
    </aside>
  );
}
