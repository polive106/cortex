import { PagePath } from "@cortex/domain";
import { brainFileUrl, pageSlug } from "@/lib/brain-location";

/** The element a citation becomes in the reply's tree, rendered by the Citation widget. */
export const CITATION_TAG = "brain-citation";

/**
 * The page a reply's link cites (`[Title](wiki/path.md)`, E3-US08), or undefined. The domain's
 * PagePath decides, so nothing outside wiki/ becomes a citation.
 */
export function citationPath(href: string): string | undefined {
  return PagePath.tryParse(href)?.value;
}

/** The cited page on GitHub, and its slug for `chat-link-citation-<slug>`. */
export { brainFileUrl as citationUrl, pageSlug as citationSlug };

/** The slice of a hast tree (rehype's HTML syntax tree) the plugin reads. */
export interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

/**
 * A rehype plugin: links to wiki pages become citation elements. The model's other links keep
 * the reply's URL policy, where a bare relative link is dropped. It runs after sanitizing, so
 * raw HTML in a reply can't make a citation element of its own.
 */
export function rehypeCitations() {
  return (tree: HastNode) => {
    visit(tree);
  };
}

function visit(node: HastNode): void {
  const href = node.properties?.href;
  const path = node.tagName === "a" && typeof href === "string" ? citationPath(href) : undefined;
  if (path !== undefined) {
    node.tagName = CITATION_TAG;
    node.properties = { path };
  }
  for (const child of node.children ?? []) visit(child);
}
