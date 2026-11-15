/** Where the agent writes an artifact's page in its sandbox (see the artifacts skill). */
export const artifactSourcePath = (slug: string): string => `artifacts/${slug}/index.html`;
