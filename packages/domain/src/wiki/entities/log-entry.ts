import { oneLine } from "./text";

export type LogOperation = "ingest" | "query" | "lint";

export interface LogEntryProps {
  /** YYYY-MM-DD */
  readonly date: string;
  readonly operation: LogOperation;
  readonly title: string;
  readonly details: readonly string[];
}

/** One append-only record in `log.md`: `## [YYYY-MM-DD] <operation> | <title>` plus details. */
export class LogEntry {
  constructor(private readonly props: LogEntryProps) {}

  format(): string {
    const { date, operation, title, details } = this.props;
    const heading = `## [${date}] ${operation} | ${oneLine(title)}\n`;
    return details.length === 0
      ? heading
      : `${heading}\n${details.map((detail) => `- ${oneLine(detail)}`).join("\n")}\n`;
  }

  appendTo(log: string): string {
    if (log === "") return this.format();
    return `${log.endsWith("\n") ? log : `${log}\n`}\n${this.format()}`;
  }
}
