import { defineChannel, GET } from "eve/channels";
import { routeAuth } from "eve/channels/auth";
import { container } from "../container";
import { serveArtifact } from "../lib/artifact-route";
import { WEB_AUTH } from "../lib/web-auth";

// Mounted at /eve/<agent>/artifacts by vercel.ts (ADR-0012), behind the web chat's auth.
export default defineChannel({
  routes: [
    GET("/artifacts", (request) =>
      serveArtifact(request, {
        authenticate: (req) => routeAuth(req, WEB_AUTH),
        readArtifact: container().readArtifact,
      }),
    ),
  ],
});
