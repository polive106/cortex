import { InvalidPathError, PageNotFoundError, type ReadBrainPage } from "@cortex/domain";
import { failure, json } from "./http";

export interface BrainPageRouteDeps {
  /** The caller's identity, or the Response that refuses them (eve's routeAuth). */
  readonly authenticate: (request: Request) => Promise<unknown>;
  readonly readBrainPage: ReadBrainPage;
}

/**
 * GET /brain/page?path=: one page of the brain (or index.md) for the web reader beside the graph
 * (E7-US04). The domain refuses every other file in the repo.
 */
export async function serveBrainPage(
  request: Request,
  deps: BrainPageRouteDeps,
): Promise<Response> {
  const caller = await deps.authenticate(request);
  if (caller instanceof Response) return caller;

  const path = new URL(request.url).searchParams.get("path");
  if (!path) return failure(400, "path is required");
  try {
    return json({ ok: true, ...(await deps.readBrainPage.execute(path)) });
  } catch (error) {
    if (error instanceof InvalidPathError) return failure(400, error.message);
    if (error instanceof PageNotFoundError) return failure(404, error.message);
    throw error;
  }
}
