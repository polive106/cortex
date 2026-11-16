import { PagePath, parseBrainRepo } from "@cortex/domain";

/** The brain repo and branch citations open on GitHub (ADR-0004). */
export interface BrainLocation {
  readonly repo: string;
  readonly branch: string;
}

const DEFAULT_REPO = "polive106/brain";

/**
 * The brain the agent reads: BRAIN_REPO ("owner/repo") and BRAIN_BRANCH, which next.config.ts
 * builds into the client. Unset or malformed values fall back to polive106/brain on main.
 */
export function brainLocation(
  repo: string | undefined = process.env.BRAIN_REPO,
  branch: string | undefined = process.env.BRAIN_BRANCH,
): BrainLocation {
  const brain = parseBrainRepo(repo ?? "", branch) ?? parseBrainRepo(DEFAULT_REPO, branch);
  const { owner, name, branch: resolved } = brain as NonNullable<typeof brain>;
  return { repo: `${owner}/${name}`, branch: resolved };
}

/** Fixed at build time, so it's read once. */
const BRAIN = brainLocation();

/** The element a citation becomes in the reply's tree, rendered by the Citation widget. */
export const CITATION_TAG = "brain-citation";

/**
 * The page a reply's link cites (`[Title](wiki/path.md)`, E3-US08), or undefined. The domain's
 * PagePath decides, so nothing outside wiki/ becomes a citation.
 */
export function citationPath(href: string): string | undefined {
  return PagePath.tryParse(href)?.value;
}

export const citationUrl = (path: string, brain: BrainLocation = BRAIN) =>
  `https://github.com/${brain.repo}/blob/${brain.branch.split("/").map(encodeURIComponent).join("/")}/${path}`;

/** "wiki/team/on-call.md" → "team-on-call", for `chat-link-citation-<slug>`. */
export const citationSlug = (path: string) =>
  path.slice("wiki/".length, -".md".length).replaceAll("/", "-");

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
