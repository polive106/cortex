import { DefaultSandbox, defineSandbox } from "eve/sandbox";
import { withDesignKit } from "./lib/design-kit-sandbox";

// Vercel Sandbox when deployed, just-bash in eve dev and evals (ADR-0012). Artifacts are written
// in the sandbox, so it carries the design kit under design/.
export const environment = DefaultSandbox.environment();

export default defineSandbox(async () => withDesignKit(await environment.open()));
