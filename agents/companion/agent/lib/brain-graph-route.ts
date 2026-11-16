import type { ReadBrainGraph } from "@cortex/domain";
import { json } from "./http";

export interface BrainGraphRouteDeps {
  /** The caller's identity, or the Response that refuses them (eve's routeAuth). */
  readonly authenticate: (request: Request) => Promise<unknown>;
  readonly readBrainGraph: ReadBrainGraph;
}

/**
 * GET /brain/graph: the brain's pages and links for the live graph (E7-US01, ADR-0015). The head
 * commit is the ETag, so a poll of an unchanged brain answers 304 with no body.
 */
export async function serveBrainGraph(
  request: Request,
  deps: BrainGraphRouteDeps,
): Promise<Response> {
  const caller = await deps.authenticate(request);
  if (caller instanceof Response) return caller;

  const { ref, graph } = await deps.readBrainGraph.execute();
  const etag = `"${ref}"`;
  const headers = { etag, "cache-control": "private, no-cache" };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return json({ ok: true, ref, nodes: graph.nodes, edges: graph.edges }, 200, headers);
}
