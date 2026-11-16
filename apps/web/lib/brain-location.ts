import { parseBrainRepo } from "@cortex/domain";

/** The brain repo and branch the web UI links to on GitHub (ADR-0004). */
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

/** A file of the brain (a page, index.md) on GitHub. */
export const brainFileUrl = (path: string, brain: BrainLocation = BRAIN) =>
  `https://github.com/${brain.repo}/blob/${brain.branch.split("/").map(encodeURIComponent).join("/")}/${path}`;

/** "wiki/team/on-call.md" → "team-on-call": a page's id in `data-testid`s. */
export const pageSlug = (path: string) =>
  path.slice("wiki/".length, -".md".length).replaceAll("/", "-");

/** "wiki/team/on-call.md" → "on-call": the page's file name, as the brain names it. */
export const pageName = (path: string) => path.slice(path.lastIndexOf("/") + 1, -".md".length);
