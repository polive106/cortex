import { DefaultSandbox, defineSandbox } from "eve/sandbox";
import { DESIGN_KIT_FILES } from "./lib/design-kit";

// Vercel Sandbox when deployed, just-bash in eve dev and evals (ADR-0012). Artifacts are written
// in the sandbox, so it carries the design kit under design/.
export const environment = DefaultSandbox.environment();

// Writing the kit on open (not in prepare) keeps every session on the current kit. The writes
// are idempotent, so a repeated initialization is harmless.
export default defineSandbox(async () => {
  const sandbox = await environment.open();
  await Promise.all(
    Object.entries(DESIGN_KIT_FILES).map(([path, content]) =>
      sandbox.writeTextFile({ path, content }),
    ),
  );
  return sandbox;
});
