"use client";

import type { EveMessage } from "eve/react";
import type { SidePanelState } from "@/lib/side-panel";
import { artifactUrl } from "../api";
import { useArtifactHtml } from "../hooks/use-artifact-html";
import { useArtifactVersions } from "../hooks/use-artifact-versions";
import { ArtifactOpenButton } from "../widgets/artifact-open-button";
import { ArtifactPanel } from "../widgets/artifact-panel";

export interface ArtifactPreviewProps {
  /** The conversation, as `useEveAgent` gives it. */
  readonly messages: readonly EveMessage[];
  /** The agent whose `/artifacts` route serves the pages. */
  readonly agent: string;
  /** Hears whether the preview is absent, closed behind its button, or open. */
  readonly onStateChange?: (state: SidePanelState) => void;
  /** Each new value closes the preview behind its button, making way for another panel. */
  readonly yieldTo?: unknown;
}

/** The artifact panel on the right of the chat, or a button to reopen it. Nothing until a publish. */
export function ArtifactPreview({ messages, agent, onStateChange, yieldTo }: ArtifactPreviewProps) {
  const { versions, selected, open, select, show, hide } = useArtifactVersions(
    messages,
    onStateChange,
    yieldTo,
  );
  const page = useArtifactHtml(open && selected ? artifactUrl(agent, selected) : undefined);

  if (!selected) return null;
  if (!open) return <ArtifactOpenButton onOpen={show} title={selected.title} />;
  return (
    <ArtifactPanel
      onClose={hide}
      onSelect={select}
      page={page}
      selected={selected}
      versions={versions}
    />
  );
}
