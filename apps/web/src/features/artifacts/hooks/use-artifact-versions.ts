import type { EveMessage } from "eve/react";
import { useEffect, useMemo, useState } from "react";
import type { SidePanelState } from "@/lib/side-panel";
import { type ArtifactVersion, artifactVersions } from "../api";

export interface ArtifactVersionsState {
  readonly versions: readonly ArtifactVersion[];
  /** The version the person picked, or else the newest. */
  readonly selected: ArtifactVersion | undefined;
  readonly open: boolean;
  readonly select: (id: string) => void;
  readonly show: () => void;
  readonly hide: () => void;
}

/**
 * The conversation's artifact versions, and which one the panel shows. A new version opens it.
 * `onStateChange` hears where the panel stands, so the chat can lay other panels out around it.
 */
export function useArtifactVersions(
  messages: readonly EveMessage[],
  onStateChange?: (state: SidePanelState) => void,
): ArtifactVersionsState {
  const versions = useMemo(() => artifactVersions(messages), [messages]);
  const latest = versions.at(-1)?.id;
  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [followed, setFollowed] = useState<string>();

  // A newer version than the last one we followed: drop the pick (so the newest shows) and open
  // the panel. Adjusting state while rendering, not in an effect, skips a frame of the old one.
  if (latest !== followed) {
    setFollowed(latest);
    setSelectedId(undefined);
    if (latest !== undefined) setOpen(true);
  }

  const shown = open && versions.length > 0;
  const state: SidePanelState = versions.length === 0 ? "none" : shown ? "open" : "closed";
  useEffect(() => onStateChange?.(state), [onStateChange, state]);

  return {
    versions,
    selected: versions.find((v) => v.id === selectedId) ?? versions.at(-1),
    open: shown,
    select: setSelectedId,
    show: () => setOpen(true),
    hide: () => setOpen(false),
  };
}
