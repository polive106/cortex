import { defaultRehypePlugins } from "streamdown";

/** The slice of a hast tree (rehype's HTML syntax tree) the link plugins read. */
export interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

/**
 * A rehype plugin: each link whose href `resolve` maps to a brain page becomes a `tag` element
 * carrying only that `path`, for a component to render (citations, reader links). Other links are
 * left to the URL policy. Use it through `safeRehypePlugins`, so it runs after sanitizing and raw
 * HTML can't make such an element of its own.
 */
export function rehypeRetagLinks(tag: string, resolve: (href: string) => string | undefined) {
  const visit = (node: HastNode): void => {
    const href = node.properties?.href;
    const path = node.tagName === "a" && typeof href === "string" ? resolve(href) : undefined;
    if (path !== undefined) {
      node.tagName = tag;
      node.properties = { path };
    }
    for (const child of node.children ?? []) visit(child);
  };
  return () => visit;
}

/**
 * Streamdown's default rehype plugins, in order, with a link plugin between sanitizing and
 * hardening (which only rewrites links).
 */
export const safeRehypePlugins = (links: ReturnType<typeof rehypeRetagLinks>) => [
  defaultRehypePlugins.raw,
  defaultRehypePlugins.sanitize,
  links,
  defaultRehypePlugins.harden,
];
