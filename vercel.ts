import { withEve } from "eve/vercel";

// Agents named *-test (such as companion-test, the mockModel double for evals and E2E) run only
// in local builds. Fail closed: any build that isn't clearly local (VERCEL_ENV unset or
// "development") leaves them out.
const isTestOnly = (service: string | undefined) => /^eve-.+-test$/.test(service ?? "");
const local = (process.env.VERCEL_ENV ?? "development") === "development";

const config = await withEve({
  services: {
    web: {
      framework: "nextjs",
      root: "apps/web",
      buildCommand: "node ../../node_modules/next/dist/bin/next build",
    },
  },
  routes: [{ src: "^(.*)$", destination: { type: "service", service: "web" } }],
});

// withEve forwards only /eve/<name>/v1/* to an agent. Agents also serve GET /artifacts
// (ADR-0012), /sessions (ADR-0013), GET /brain/graph (E7-US01) and GET /brain/page (E7-US04), so
// mount each at /eve/<name>/<path> the same way: a top-level route to the service, and a service
// route that rewrites the path. The mount comes from withEve's own v1 route, so it follows
// withEve's naming.
const AGENT_PATHS = ["/artifacts", "/sessions", "/brain/graph", "/brain/page"];
const V1_ROUTE = /^\^(\/eve\/[a-z0-9_-]+)\/v1\/\(\.\*\)\$$/;
type Service = { routes?: { src?: string; transforms?: unknown[] }[] };

function withAgentRoutes(input: typeof config): typeof config {
  const services = { ...input.services } as unknown as Record<string, Service>;
  const routes = [...input.routes];
  for (const [name, service] of Object.entries(services)) {
    const mount = service.routes?.map((r) => V1_ROUTE.exec(r.src ?? "")?.[1]).find(Boolean);
    if (!mount) continue;
    const rewrites = AGENT_PATHS.map((path) => {
      const src = `^${mount}${path}$`;
      routes.unshift({ src, destination: { type: "service", service: name } });
      return { src, transforms: [{ type: "request.path", op: "set", args: path }] };
    });
    services[name] = { ...service, routes: [...rewrites, ...(service.routes ?? [])] };
  }
  return { ...input, services, routes } as unknown as typeof config;
}

const mounted = withAgentRoutes(config);

export default local
  ? mounted
  : {
      ...mounted,
      services: Object.fromEntries(
        Object.entries(mounted.services).filter(([name]) => !isTestOnly(name)),
      ),
      routes: mounted.routes.filter(
        (route) =>
          !(typeof route.destination === "object" && isTestOnly(route.destination.service)),
      ),
    };
