type ReplaceState = (state: unknown, unused: string, url: string) => void;

type SessionWindow = {
  readonly location: { readonly pathname: string };
  readonly history: { readonly state: unknown };
};

export const sessionPath = (sessionId: string) => `/s/${encodeURIComponent(sessionId)}`;

/**
 * Points the URL at the session without navigating. eve calls `onSessionChange` on every
 * stream event, and Safari throws once `replaceState` runs over 100 times in 10 seconds,
 * so this only writes when the path actually changes.
 */
export function replaceSessionRoute(
  win: SessionWindow,
  sessionId: string,
  replaceState: ReplaceState,
): void {
  const path = sessionPath(sessionId);
  if (win.location.pathname === path) return;
  replaceState(win.history.state, "", path);
}
