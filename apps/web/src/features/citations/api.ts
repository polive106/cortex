import { PagePath } from "@cortex/domain";
import { brainFileUrl, pageSlug } from "@/lib/brain-location";
import { rehypeRetagLinks } from "@/lib/markdown-links";

/** The element a citation becomes in the reply's tree, rendered by the Citation widget. */
export const CITATION_TAG = "brain-citation";

/**
 * The page a reply's link cites (`[Title](wiki/path.md)`, E3-US08), or undefined. The domain's
 * PagePath decides, so nothing outside wiki/ becomes a citation.
 */
export function citationPath(href: string): string | undefined {
  return PagePath.tryParse(href)?.value;
}

export type { HastNode } from "@/lib/markdown-links";
/** The cited page on GitHub, and its slug for `chat-link-citation-<slug>`. */
export { brainFileUrl as citationUrl, pageSlug as citationSlug };

/**
 * A rehype plugin: links to wiki pages become citation elements. The model's other links keep
 * the reply's URL policy, where a bare relative link is dropped. It runs after sanitizing, so
 * raw HTML in a reply can't make a citation element of its own.
 */
export const rehypeCitations = rehypeRetagLinks(CITATION_TAG, citationPath);
