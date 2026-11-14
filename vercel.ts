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

export default local
  ? config
  : {
      ...config,
      services: Object.fromEntries(
        Object.entries(config.services).filter(([name]) => !isTestOnly(name)),
      ),
      routes: config.routes.filter(
        (route) =>
          !(typeof route.destination === "object" && isTestOnly(route.destination.service)),
      ),
    };
