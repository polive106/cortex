import { InvalidArtifactError } from "../errors";
import type { ArtifactPath } from "./artifact-path";

/**
 * The page may run its own inline code and styles but load nothing (ADR-0012). The preview's
 * iframe sandbox keeps it off the app's origin; this keeps it off the network.
 */
export const ARTIFACT_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";

/** Generous for a hand-sized page, small enough to keep commits and the preview fast. */
export const MAX_SOURCE_LENGTH = 512 * 1024;

const OPEN = "<!-- cortex:artifact -->";
const CLOSE = "<!-- /cortex:artifact -->";
const STYLE_OPEN = "<style data-cortex-artifact>";

const HEAD_TAG = /<head(\s[^>]*)?>/i;
const HTML_TAG = /<html(\s[^>]*)?>/i;
const HEAD_BLOCK = new RegExp(`\\n${OPEN}[\\s\\S]*?${CLOSE}`);
const STYLE_BLOCK = new RegExp(`${STYLE_OPEN}[\\s\\S]*?</style>\\n`);
const VERSION = /<meta name="cortex:version" content="(\d+)">/;
const TITLE = /<title>([^<]*)<\/title>/i;

/** What a page may not contain, with the fix the model should make. */
const RULES: readonly (readonly [RegExp, string])[] = [
  [
    /<script\b[^>]*\bsrc\s*=/i,
    "external scripts aren't allowed; put the code in an inline <script>",
  ],
  [
    /<link\b[^>]*\bhref\s*=/i,
    "external stylesheets and links aren't allowed; use Tailwind classes",
  ],
  [/<(iframe|frame|frameset|object|embed)\b/i, "frames and embeds aren't allowed"],
  [/<base\b/i, "<base> isn't allowed"],
  [
    /<meta\b[^>]*\bhttp-equiv\b/i,
    "http-equiv meta tags aren't allowed; the page's CSP is added for you",
  ],
];

export interface ArtifactProps {
  readonly path: ArtifactPath;
  readonly title: string;
  readonly version: number;
  /** The page as the agent wrote it, without anything `render` adds. */
  readonly source: string;
}

/** A self-contained HTML page in the brain's `out/` folder (ADR-0012). */
export class Artifact {
  private constructor(
    readonly path: ArtifactPath,
    readonly title: string,
    readonly version: number,
    readonly source: string,
  ) {}

  /** A new version to publish. Throws InvalidArtifactError when the source breaks a rule. */
  static create({ path, title, version, source }: ArtifactProps): Artifact {
    const clean = strip(source);
    if (clean.trim() === "") throw new InvalidArtifactError("The artifact is empty");
    if (clean.length > MAX_SOURCE_LENGTH) {
      throw new InvalidArtifactError(`The artifact is over ${MAX_SOURCE_LENGTH / 1024} KB`);
    }
    for (const [pattern, reason] of RULES) {
      if (pattern.test(clean)) throw new InvalidArtifactError(`Invalid artifact: ${reason}`);
    }
    if (version < 1) throw new InvalidArtifactError("Versions start at 1");
    return new Artifact(path, title, version, clean);
  }

  /** The same page as another version, without validating it again. */
  withVersion(version: number): Artifact {
    return new Artifact(this.path, this.title, version, this.source);
  }

  /** A stored page. Files written by hand have no version (0) and are titled by their slug. */
  static parse(path: ArtifactPath, html: string): Artifact {
    const version = Number(VERSION.exec(html)?.[1] ?? 0);
    const title = TITLE.exec(html)?.[1];
    return new Artifact(path, title ? decode(title) : path.slug, version, strip(html));
  }

  /** The published page: CSP and version first in `<head>`, the compiled CSS last. */
  render(css: string): string {
    const doc = toDocument(this.source, this.title);
    const head = `\n${OPEN}\n<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">\n<meta name="cortex:version" content="${this.version}">\n${CLOSE}`;
    // `</style` inside the CSS would end the element early and let the rest run as markup.
    const style = `${STYLE_OPEN}${css.replace(/<\/style/gi, "<\\/style")}</style>\n`;
    const withHead = doc.replace(HEAD_TAG, (tag) => `${tag}${head}`);
    const close = withHead.search(/<\/head>/i);
    return close === -1
      ? withHead.replace(CLOSE, `${CLOSE}${style}`)
      : `${withHead.slice(0, close)}${style}${withHead.slice(close)}`;
  }
}

/** Removes everything `render` added, so a published page can be edited and published again. */
function strip(html: string): string {
  return html.replace(HEAD_BLOCK, "").replace(STYLE_BLOCK, "");
}

/** Makes sure there's a `<head>` to put the CSP in, wrapping a bare fragment in a document. */
function toDocument(source: string, title: string): string {
  if (HEAD_TAG.test(source)) return source;
  const head = `<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escape(title)}</title>\n</head>`;
  if (HTML_TAG.test(source)) return source.replace(HTML_TAG, (tag) => `${tag}\n${head}`);
  return `<!doctype html>\n<html lang="en">\n${head}\n<body>\n${source}\n</body>\n</html>\n`;
}

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ENTITIES[char] as string);

const DECODE = new Map(Object.entries(ENTITIES).map(([char, entity]) => [entity, char]));

const decode = (text: string) =>
  text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => DECODE.get(entity) as string);
