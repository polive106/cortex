/** Where the brain lives on GitHub: BRAIN_REPO ("owner/repo") and BRAIN_BRANCH (ADR-0005). */
export interface BrainRepo {
  readonly owner: string;
  readonly name: string;
  readonly branch: string;
}

const REPO = /^([\w.-]+)\/([\w.-]+)$/;

/**
 * One reading of the brain settings for the agent and the web UI, so citations open the repo the
 * agent reads. Undefined for anything but "owner/repo"; the branch defaults to main.
 */
export function parseBrainRepo(repo: string, branch?: string): BrainRepo | undefined {
  const match = REPO.exec(repo);
  if (!match) return undefined;
  return { owner: match[1] as string, name: match[2] as string, branch: branch || "main" };
}
