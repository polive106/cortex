import type { EveMessage } from "eve/react";
import { useMemo, useState } from "react";
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

/** The conversation's artifact versions, and which one the panel shows. A new version opens it. */
export function useArtifactVersions(messages: readonly EveMessage[]): ArtifactVersionsState {
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

  return {
    versions,
    selected: versions.find((v) => v.id === selectedId) ?? versions.at(-1),
    open: open && versions.length > 0,
    select: setSelectedId,
    show: () => setOpen(true),
    hide: () => setOpen(false),
  };
}
