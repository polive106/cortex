import { parseBrainRepo } from "@cortex/domain";

/** The brain repo and branch the web UI links to on GitHub (ADR-0004). */
export interface BrainLocation {
  readonly repo: string;
  readonly branch: string;
}

/**
 * The brain the agent reads: BRAIN_REPO ("owner/repo") and BRAIN_BRANCH, which next.config.ts
 * builds into the client. Unset or malformed, there is no brain on GitHub to link to.
 */
export function brainLocation(
  repo: string | undefined = process.env.BRAIN_REPO,
  branch: string | undefined = process.env.BRAIN_BRANCH,
): BrainLocation | undefined {
  const brain = parseBrainRepo(repo ?? "", branch);
  return brain && { repo: `${brain.owner}/${brain.name}`, branch: brain.branch };
}

/** Fixed at build time, so it's read once. */
const BRAIN = brainLocation();

/** A file of the brain (a page, index.md) on GitHub, or undefined when no brain repo is set. */
export const brainFileUrl = (path: string, brain: BrainLocation | undefined = BRAIN) =>
  brain &&
  `https://github.com/${brain.repo}/blob/${brain.branch.split("/").map(encodeURIComponent).join("/")}/${path}`;

/** "wiki/team/on-call.md" → "team-on-call": a page's id in `data-testid`s. */
export const pageSlug = (path: string) =>
  path.slice("wiki/".length, -".md".length).replaceAll("/", "-");

/** "wiki/team/on-call.md" → "on-call": the page's file name, as the brain names it. */
export const pageName = (path: string) => path.slice(path.lastIndexOf("/") + 1, -".md".length);
