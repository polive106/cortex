import type { RecordSessionActivityRequest } from "@cortex/domain";

type Part = { readonly kind: string; readonly text?: string };
type Principal = { readonly principalId: string; readonly principalType: string };

// The deployment's own callers and schedules: no person to list the session for.
const NOT_A_PERSON = new Set(["runtime", "service"]);

/**
 * The session-index entry for one consumed delivery (ADR-0013), or null when there's nothing to
 * record: a delivery that only adds context, or a session no person started.
 */
export function webActivity(input: {
  readonly sessionId: string;
  readonly initiator: Principal | null | undefined;
  readonly parts: readonly Part[];
  readonly now: Date;
}): RecordSessionActivityRequest | null {
  const { sessionId, initiator, parts, now } = input;
  if (!initiator || NOT_A_PERSON.has(initiator.principalType) || parts.length === 0) return null;
  const message = parts
    .flatMap((part) => (part.kind === "text" && part.text ? [part.text] : []))
    .join(" ");
  return { owner: initiator.principalId, sessionId, message, at: now };
}
