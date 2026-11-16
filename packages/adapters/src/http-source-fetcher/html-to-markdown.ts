/**
 * A small, dependency-free HTML to Markdown pass for saving web pages to the brain (E3-US07).
 * It keeps the readable content (headings, paragraphs, lists, links, code) and drops scripts,
 * styles, navigation, images, and every attribute. The output is text for the model and for
 * raw/, never HTML that gets rendered, so a missed tag degrades the text but can't run.
 */
export function htmlToMarkdown(html: string, pageUrl: string): { title: string; text: string } {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(DROPPED, "");
  return { title: titleOf(cleaned, pageUrl), text: toMarkdown(contentOf(cleaned), pageUrl) };
}

const DROPPED =
  /<(script|style|noscript|template|svg|iframe|object|canvas|nav|footer|aside|form|button|select)\b[\s\S]*?<\/\1\s*>/gi;

function titleOf(html: string, pageUrl: string): string {
  const og = /<meta\b[^>]*\bproperty=["']og:title["'][^>]*\bcontent=["']([^"']*)["']/i.exec(
    html,
  )?.[1];
  const candidates = [
    og,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1],
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1],
  ];
  for (const candidate of candidates) {
    const title = oneLine(decode(stripTags(candidate ?? "")));
    if (title) return title;
  }
  return new URL(pageUrl).hostname;
}

/** Where the readable content is, best first. */
const CONTAINERS = ["article", "main", "body"].map(
  (tag) => new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}\\s*>`, "i"),
);

function contentOf(html: string): string {
  for (const container of CONTAINERS) {
    const inner = container.exec(html)?.[1];
    if (inner !== undefined) return inner;
  }
  return html.replace(/<head\b[\s\S]*?<\/head\s*>/i, "");
}

function toMarkdown(html: string, pageUrl: string): string {
  const blocks: string[] = [];
  // Preformatted code keeps its whitespace, so it's set aside before anything collapses it.
  const hold = (block: string) => `\u0000${blocks.push(block) - 1}\u0000`;
  const text = html
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre\s*>/gi, (_, code: string) =>
      hold(`\`\`\`\n${decode(stripTags(code)).replace(/^\n+|\n+$/g, "")}\n\`\`\``),
    )
    // Source line breaks are just spaces in HTML; the block rules below add the real ones.
    .replace(/\s+/g, " ")
    .replace(/\u0000\d+\u0000/g, (held) => `\n\n${held}\n\n`)
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_, level: string, inner: string) => {
      return `\n\n${"#".repeat(Number(level))} ${oneLine(stripTags(inner))}\n\n`;
    })
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (_, attributes: string, inner: string) =>
      link(attributes, oneLine(stripTags(inner)), pageUrl),
    )
    .replace(
      /<code\b[^>]*>([\s\S]*?)<\/code\s*>/gi,
      (_, inner: string) => `\`${stripTags(inner)}\``,
    )
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(
      /<\/?(p|div|section|blockquote|ul|ol|table|tr|hr|header|figure|dl|dt|dd)\b[^>]*>/gi,
      "\n\n",
    );

  return decode(stripTags(text))
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/\u0000(\d+)\u0000/g, (_, i: string) => blocks[Number(i)] as string);
}

function link(attributes: string, text: string, pageUrl: string): string {
  const href = /\bhref=["']([^"']*)["']/i.exec(attributes)?.[1];
  if (!text) return "";
  const url = href === undefined ? null : URL.parse(decode(href), pageUrl);
  const isWeb = url !== null && (url.protocol === "https:" || url.protocol === "http:");
  if (!isWeb || href?.startsWith("#")) return text;
  return `[${text}](${url.href})`;
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, "");
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
};

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (!name.startsWith("#")) return NAMED[name.toLowerCase()] ?? entity;
    const code =
      name[1]?.toLowerCase() === "x" ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
    const valid = code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
    return valid ? String.fromCodePoint(code) : entity;
  });
}
