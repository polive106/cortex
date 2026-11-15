import type { SandboxSession } from "eve/sandbox";
import { DESIGN_KIT_FILES } from "./design-kit";

/**
 * Writes the design kit to design/ in a freshly opened sandbox (E5-US04). Doing it on open, not in
 * prepare, keeps every session on the current kit; the writes are idempotent, so a repeated
 * initialization is harmless.
 */
export async function withDesignKit<T extends Pick<SandboxSession, "writeTextFile">>(
  sandbox: T,
): Promise<T> {
  await Promise.all(
    Object.entries(DESIGN_KIT_FILES).map(([path, content]) =>
      sandbox.writeTextFile({ path, content }),
    ),
  );
  return sandbox;
}
