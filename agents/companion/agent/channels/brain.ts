import { defineChannel, GET } from "eve/channels";
import { routeAuth } from "eve/channels/auth";
import { container } from "../container";
import { serveBrainGraph } from "../lib/brain-graph-route";
import { serveBrainPage } from "../lib/brain-page-route";
import { WEB_AUTH } from "../lib/web-auth";

// Mounted at /eve/<agent>/brain/graph and /eve/<agent>/brain/page by vercel.ts (E7-US01,
// E7-US04), behind the web chat's auth.
const authenticate = (request: Request) => routeAuth(request, WEB_AUTH);

export default defineChannel({
  routes: [
    GET("/brain/graph", (request) =>
      serveBrainGraph(request, { authenticate, readBrainGraph: container().readBrainGraph }),
    ),
    GET("/brain/page", (request) =>
      serveBrainPage(request, { authenticate, readBrainPage: container().readBrainPage }),
    ),
  ],
});
