import { useEffect, useState } from "react";

export type ArtifactHtml =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly html: string }
  | { readonly status: "error"; readonly error: string };

type Loaded = {
  readonly url: string;
  readonly state: Exclude<ArtifactHtml, { status: "idle" | "loading" }>;
};

/** Fetches one artifact page for the preview, with the signed-in session's cookie. */
export function useArtifactHtml(url: string | undefined): ArtifactHtml {
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    if (url === undefined) return;
    const controller = new AbortController();
    fetch(url, { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        const state: Loaded["state"] = response.ok
          ? { status: "ready", html: await response.text() }
          : { status: "error", error: `Couldn't load the artifact (${response.status})` };
        if (!controller.signal.aborted) setLoaded({ url, state });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoaded({ url, state: { status: "error", error: "Couldn't load the artifact" } });
        }
      });
    return () => controller.abort();
  }, [url]);

  if (url === undefined) return { status: "idle" };
  return loaded?.url === url ? loaded.state : { status: "loading" };
}
