import { DELETE, defineChannel, GET, PATCH } from "eve/channels";
import { routeAuth } from "eve/channels/auth";
import { SessionNotActiveError } from "eve/sessions";
import { container } from "../container";
import { sessionsRoute } from "../lib/sessions-route";
import { WEB_AUTH } from "../lib/web-auth";

const route = () => {
  const c = container();
  return sessionsRoute({
    authenticate: (request) => routeAuth(request, WEB_AUTH),
    listSessions: c.listSessions,
    renameSession: c.renameSession,
    removeSession: c.removeSession,
  });
};

// The signed-in user's session list (ADR-0013). Mounted at /eve/<agent>/sessions by vercel.ts,
// behind the web chat's auth. One path with ?id=, so vercel.ts mounts a fixed route.
export default defineChannel({
  routes: [
    GET("/sessions", (request) => route().list(request)),
    PATCH("/sessions", (request) => route().rename(request)),
    DELETE("/sessions", (request, { attachSession }) =>
      route().remove(request, {
        async end(sessionId) {
          try {
            await attachSession(sessionId).end({ reason: "Deleted from the session list" });
          } catch (error) {
            // Already ended (timed out, or deleted twice): nothing left to end.
            if (!(error instanceof SessionNotActiveError)) throw error;
          }
        },
      }),
    ),
  ],
});
