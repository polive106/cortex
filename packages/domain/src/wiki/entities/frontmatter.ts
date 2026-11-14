type Fields = Record<string, string | string[]>;

/**
 * The brain's small frontmatter dialect: `key: value` lines, and lists as `key:` followed by
 * `  - item` lines (or `key: []`). It's not general YAML: we only read what we write.
 */
export function parseFrontmatter(markdown: string): { fields: Fields; body: string } {
  if (!markdown.startsWith("---\n")) return { fields: {}, body: markdown };
  const end = markdown.indexOf("\n---\n", 3);
  if (end === -1) return { fields: {}, body: markdown };
  const fields: Fields = {};
  let list: string[] | undefined;
  for (const line of markdown.slice(4, end).split("\n")) {
    if (line.startsWith("  - ") && list) {
      list.push(line.slice(4));
      continue;
    }
    const colon = line.indexOf(":");
    const key = line.slice(0, colon);
    const value = line.slice(colon + 1).trim();
    list = value === "" || value === "[]" ? [] : undefined;
    fields[key] = list ?? value;
  }
  return { fields, body: markdown.slice(end + "\n---\n".length).replace(/^\n/, "") };
}

export function serializeFrontmatter(fields: Fields, body: string): string {
  const lines = Object.entries(fields).flatMap(([key, value]) => {
    if (!Array.isArray(value)) return [`${key}: ${value}`];
    return value.length === 0 ? [`${key}: []`] : [`${key}:`, ...value.map((item) => `  - ${item}`)];
  });
  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}
