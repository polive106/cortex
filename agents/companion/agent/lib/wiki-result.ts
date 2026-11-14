import { WikiError } from "@cortex/domain";

export interface WikiErrorResult {
  readonly error: string;
  readonly message: string;
}

/**
 * Runs a use-case for a tool. Domain errors become a result the model can read and act on (fix
 * the path, search first, try again). Anything else, like a GitHub failure, fails the call
 * instead, so no infrastructure detail reaches the model.
 */
export async function wikiResult<T>(run: () => Promise<T>): Promise<T | WikiErrorResult> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof WikiError) return { error: error.name, message: error.message };
    throw error;
  }
}
