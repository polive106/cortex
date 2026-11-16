import type { ReactNode } from "react";
import { type Components, defaultRehypePlugins, type StreamdownProps } from "streamdown";
import { CITATION_TAG, citationPath, rehypeCitations } from "../api";
import { Citation } from "../widgets/citation";

function CitationElement({ path, children }: { path?: unknown; children?: ReactNode }) {
  const valid = typeof path === "string" ? citationPath(path) : undefined;
  return valid === undefined ? children : <Citation path={valid}>{children}</Citation>;
}

/**
 * Streamdown props that render wiki citations in a reply. The default plugins stay, in order;
 * citations are found after sanitizing and before hardening, which only rewrites links.
 */
export const citationMarkdown = {
  rehypePlugins: [
    defaultRehypePlugins.raw,
    defaultRehypePlugins.sanitize,
    rehypeCitations,
    defaultRehypePlugins.harden,
  ],
  components: { [CITATION_TAG]: CitationElement } as Components,
} satisfies Pick<StreamdownProps, "rehypePlugins" | "components">;
