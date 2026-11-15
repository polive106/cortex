import {
  ARTIFACT_CSP,
  ArtifactNotFoundError,
  InvalidPathError,
  type ReadArtifact,
} from "@cortex/domain";

export interface ArtifactRouteDeps {
  /** The caller's identity, or the Response that refuses them (eve's routeAuth). */
  readonly authenticate: (request: Request) => Promise<unknown>;
  readonly readArtifact: ReadArtifact;
}

const failure = (status: number, error: string) =>
  Response.json({ ok: false, error }, { status, headers: { "cache-control": "no-store" } });

/**
 * GET /artifacts?path=out/...html[&ref=<commit>]: one artifact version as HTML, for the web
 * preview (ADR-0012). The CSP `sandbox` keeps a page opened directly off the app's origin.
 */
export async function serveArtifact(request: Request, deps: ArtifactRouteDeps): Promise<Response> {
  const caller = await deps.authenticate(request);
  if (caller instanceof Response) return caller;

  const params = new URL(request.url).searchParams;
  const path = params.get("path");
  if (!path) return failure(400, "path is required");
  const ref = params.get("ref") ?? undefined;
  try {
    const { html } = await deps.readArtifact.execute(path, ref);
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": `sandbox allow-scripts; ${ARTIFACT_CSP}`,
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        // A commit's version never changes; the latest one does.
        "cache-control": ref ? "private, max-age=31536000, immutable" : "private, no-cache",
      },
    });
  } catch (error) {
    if (error instanceof InvalidPathError) return failure(400, error.message);
    if (error instanceof ArtifactNotFoundError) return failure(404, error.message);
    throw error;
  }
}
