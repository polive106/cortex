import type { AskedCall } from "eve/react";

const MAX_VALUE_LENGTH = 120;

const truncate = (value: string) =>
  value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH - 1)}…` : value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * One "key: value" line per input field of the call an approval would run. eve's prompt already
 * names the tool, so the card shows only what the call would do.
 */
export function approvalDetails(call: AskedCall | undefined): string[] {
  const input = call?.input;
  if (!isRecord(input)) return [];
  return Object.entries(input).map(([key, value]) => {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return `${key}: ${truncate(text)}`;
  });
}
