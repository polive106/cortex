import {
  InvalidSessionTitleError,
  type ListSessions,
  type RemoveSession,
  type RenameSession,
  type SessionEnder,
  SessionNotFoundError,
} from "@cortex/domain";
import { failure, json } from "./http";

export interface SessionsRouteDeps {
  /** The caller's identity, or the Response that refuses them (eve's routeAuth). */
  readonly authenticate: (request: Request) => Promise<unknown>;
  readonly listSessions: ListSessions;
  readonly renameSession: RenameSession;
  readonly removeSession: RemoveSession;
}

type Caller = { readonly principalId: string };

/** Domain refusals as HTTP answers; anything else goes to eve's error handling. */
async function answering(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof InvalidSessionTitleError) return failure(400, error.message);
    if (error instanceof SessionNotFoundError) return failure(404, error.message);
    throw error;
  }
}

/**
 * The caller's session list (ADR-0013), scoped to their principal: GET /sessions,
 * PATCH /sessions?id=<id> with { title }, and DELETE /sessions?id=<id>, one handler each.
 */
export function sessionsRoute(deps: SessionsRouteDeps) {
  const owner = async (request: Request): Promise<string | Response> => {
    const caller = await deps.authenticate(request);
    return caller instanceof Response ? caller : (caller as Caller).principalId;
  };
  /** The caller and the session named by `?id=`, or the Response that refuses the request. */
  const target = async (request: Request) => {
    const principal = await owner(request);
    if (principal instanceof Response) return principal;
    const sessionId = new URL(request.url).searchParams.get("id");
    return sessionId ? { owner: principal, sessionId } : failure(400, "id is required");
  };

  return {
    async list(request: Request): Promise<Response> {
      const principal = await owner(request);
      if (principal instanceof Response) return principal;
      const sessions = await deps.listSessions.execute(principal);
      return json({
        sessions: sessions.map(({ sessionId, title, createdAt, updatedAt, expired }) => ({
          sessionId,
          title,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          expired,
        })),
      });
    },

    async rename(request: Request): Promise<Response> {
      const t = await target(request);
      if (t instanceof Response) return t;
      const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
      if (typeof body?.title !== "string") return failure(400, "title must be a string");
      const title = body.title;
      return answering(async () => {
        const renamed = await deps.renameSession.execute(t.owner, t.sessionId, title);
        return json({ ok: true, title: renamed.title });
      });
    },

    /** `runtime` ends the eve session; it's bound to the request, so it comes per call. */
    async remove(request: Request, runtime: SessionEnder): Promise<Response> {
      const t = await target(request);
      if (t instanceof Response) return t;
      return answering(async () => {
        await deps.removeSession.execute(t.owner, t.sessionId, runtime);
        return json({ ok: true });
      });
    },
  };
}
