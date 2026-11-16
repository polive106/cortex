import { defineChannel, GET } from "eve/channels";
import { routeAuth } from "eve/channels/auth";
import { container } from "../container";
import { serveBrainGraph } from "../lib/brain-graph-route";
import { WEB_AUTH } from "../lib/web-auth";

// Mounted at /eve/<agent>/brain/graph by vercel.ts (E7-US01), behind the web chat's auth.
export default defineChannel({
  routes: [
    GET("/brain/graph", (request) =>
      serveBrainGraph(request, {
        authenticate: (req) => routeAuth(req, WEB_AUTH),
        readBrainGraph: container().readBrainGraph,
      }),
    ),
  ],
});
