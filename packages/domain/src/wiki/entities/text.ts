/** A lowercase kebab-case slug, as `slugify` produces: `deploy-notes-v2`. */
export const KEBAB = "[a-z0-9]+(?:-[a-z0-9]+)*";

/** Collapses line breaks so a value fits on one line of frontmatter, index, or log. */
export const oneLine = (value: string): string => value.replace(/\r?\n/g, " ");

/** Lowercase kebab-case from free text: "Deploy Notes: v2!" → "deploy-notes-v2". */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** YYYY-MM-DD in UTC. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
