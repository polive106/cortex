/** A JSON response that's never cached: route results are per user and change. */
export const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** The `{ ok: false, error }` body companion's routes answer a refused request with. */
export const failure = (status: number, error: string): Response =>
  json({ ok: false, error }, status);
