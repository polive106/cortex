import type { ReactNode } from "react";
import type { Components, StreamdownProps } from "streamdown";
import { useOpenBrainPage } from "@/lib/brain-reader-context";
import { safeRehypePlugins } from "@/lib/markdown-links";
import { CITATION_TAG, citationPath, rehypeCitations } from "../api";
import { Citation } from "../widgets/citation";

function CitationElement({ path, children }: { path?: unknown; children?: ReactNode }) {
  const openPage = useOpenBrainPage();
  const valid = typeof path === "string" ? citationPath(path) : undefined;
  return valid === undefined ? (
    children
  ) : (
    <Citation onOpen={openPage} path={valid}>
      {children}
    </Citation>
  );
}

/**
 * Streamdown props that render wiki citations in a reply. The default plugins stay, in order;
 * citations are found after sanitizing and before hardening, which only rewrites links.
 */
export const citationMarkdown = {
  rehypePlugins: safeRehypePlugins(rehypeCitations),
  components: { [CITATION_TAG]: CitationElement } as Components,
} satisfies Pick<StreamdownProps, "rehypePlugins" | "components">;
