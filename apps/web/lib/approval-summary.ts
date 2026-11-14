import type { AskedCall } from "eve/react";

const MAX_PREVIEW_LENGTH = 120;

export interface ApprovalDetail {
  readonly key: string;
  /** One line, cut to fit the card. */
  readonly preview: string;
  /** The whole value (nested values pretty-printed), so the approver can see what will run. */
  readonly full: string;
  readonly truncated: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * One entry per input field of the call an approval would run. eve's prompt already names the
 * tool. The card shows each field's preview and lets the approver expand the full value.
 */
export function approvalDetails(call: AskedCall | undefined): ApprovalDetail[] {
  const input = call?.input;
  if (!isRecord(input)) return [];
  return Object.entries(input).map(([key, value]) => {
    const line = typeof value === "string" ? value : JSON.stringify(value);
    const full = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    const truncated = line.length > MAX_PREVIEW_LENGTH;
    const preview = truncated ? `${line.slice(0, MAX_PREVIEW_LENGTH - 1)}…` : line;
    return { key, preview, full, truncated };
  });
}
