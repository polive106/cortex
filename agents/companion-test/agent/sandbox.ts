import { defineSandbox } from "eve/sandbox";
import { JustBashSandbox } from "eve/sandbox/just-bash";
import { withDesignKit } from "../../companion/agent/lib/design-kit-sandbox.js";

// Always just-bash, with companion's design kit: under `vercel dev` (E2E) the default provider
// would pick Vercel Sandbox, which needs Vercel credentials the token-free test double lacks.
export const environment = JustBashSandbox.environment();

export default defineSandbox(async () => withDesignKit(await environment.open()));
