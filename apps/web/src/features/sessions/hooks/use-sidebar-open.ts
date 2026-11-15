import { useState } from "react";

/** The breakpoint where the sidebar starts open (Tailwind's `md`). */
const WIDE_SCREEN = "(min-width: 48rem)";

export interface SidebarOpenState {
  /** Undefined until toggled: CSS opens it on wide screens only, with no hydration mismatch. */
  readonly open: boolean | undefined;
  readonly toggle: () => void;
}

export function useSidebarOpen(): SidebarOpenState {
  const [open, setOpen] = useState<boolean>();
  return {
    open,
    toggle: () => setOpen((current) => !(current ?? window.matchMedia(WIDE_SCREEN).matches)),
  };
}
