import type { UrlTransform } from "streamdown";

const SAFE_LINK_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

const BASE = new URL("https://app.invalid");
// Browsers turn a backslash into "/" and drop tabs and newlines, so "/<backslash>evil.example"
// means "//evil.example". Reject those characters outright.
const NORMALIZED_AWAY = /[\\\u0000-\u001F\s]/;

/** A same-page anchor, or a root-relative path that still resolves to this app after parsing. */
function isSameOrigin(url: string): boolean {
  if (url.startsWith("#")) return true;
  if (!url.startsWith("/") || NORMALIZED_AWAY.test(url)) return false;
  return URL.parse(url, BASE)?.origin === BASE.origin;
}

/**
 * URL policy for model-written markdown. Model replies can carry text from prompt injections in
 * fetched pages or wiki content:
 * - a remote image loads with no click and could send data out in its URL, so images may only
 *   point at this app;
 * - links may only use web or mail protocols (Streamdown's default linkSafety asks before opening).
 * Returning null drops the attribute. This replaces Streamdown's defaultUrlTransform on purpose: it
 * is stricter (no bare relative links) and doesn't depend on later sanitizing.
 */
export const safeMarkdownUrl: UrlTransform = (url, key, node) => {
  if (isSameOrigin(url)) return url;
  if (node.tagName === "img" && key === "src") return null;
  // URL.parse returns null for relative URLs, which have no protocol to trust.
  const protocol = URL.parse(url)?.protocol;
  return protocol !== undefined && SAFE_LINK_PROTOCOLS.has(protocol) ? url : null;
};
