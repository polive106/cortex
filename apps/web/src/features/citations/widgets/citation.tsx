import type { ReactNode } from "react";
import { citationSlug, citationUrl } from "../api";

export interface CitationProps {
  /** A validated page path, `wiki/<kebab>.md`. */
  readonly path: string;
  readonly children?: ReactNode;
  /** Opens the page in the brain reader beside the chat (E7-US04), instead of GitHub. */
  readonly onOpen?: (path: string) => void;
}

/**
 * A cited brain page, linked on GitHub so the reader can check or fix the source (E3-US08). In
 * the chat a plain click opens it in the brain reader instead (E7-US04); a modified click, a
 * middle click or copying the link still go to GitHub.
 */
export function Citation({ path, children, onOpen }: CitationProps) {
  return (
    <a
      className="wrap-anywhere font-medium text-primary underline decoration-dotted underline-offset-2"
      data-testid={`chat-link-citation-${citationSlug(path)}`}
      href={citationUrl(path)}
      onClick={(event) => {
        if (!onOpen || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onOpen(path);
      }}
      rel="noreferrer"
      target="_blank"
      title={path}
    >
      {children}
    </a>
  );
}
