import type { ReactNode } from "react";
import { citationSlug, citationUrl } from "../api";

export interface CitationProps {
  /** A validated page path, `wiki/<kebab>.md`. */
  readonly path: string;
  readonly children?: ReactNode;
}

/** A cited brain page, linked on GitHub so the reader can check or fix the source (E3-US08). */
export function Citation({ path, children }: CitationProps) {
  return (
    <a
      className="wrap-anywhere font-medium text-primary underline decoration-dotted underline-offset-2"
      data-testid={`chat-link-citation-${citationSlug(path)}`}
      href={citationUrl(path)}
      rel="noreferrer"
      target="_blank"
      title={path}
    >
      {children}
    </a>
  );
}
