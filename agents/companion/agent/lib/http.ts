/**
 * A JSON response that's never cached by default: route results are per user and change. A route
 * that revalidates instead (an ETag) passes its own `cache-control`.
 */
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

/** The `{ ok: false, error }` body companion's routes answer a refused request with. */
export const failure = (status: number, error: string): Response =>
  json({ ok: false, error }, status);
