export class InvalidPagePathError extends Error {
  constructor(input: string, reason: string) {
    super(`Invalid wiki page path "${input}": ${reason}`);
    this.name = "InvalidPagePathError";
  }
}

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A validated location of a wiki page: `wiki/<kebab-segments>.md`. */
export class PagePath {
  private constructor(readonly value: string) {}

  static parse(input: string): PagePath {
    if (!input.startsWith("wiki/")) throw new InvalidPagePathError(input, "must live under wiki/");
    if (!input.endsWith(".md")) throw new InvalidPagePathError(input, "must be a .md file");
    const segments = input.slice("wiki/".length, -".md".length).split("/");
    if (!segments.every((segment) => SEGMENT.test(segment))) {
      throw new InvalidPagePathError(input, "segments must be lowercase kebab-case");
    }
    return new PagePath(input);
  }

  static fromTitle(title: string): PagePath {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return PagePath.parse(`wiki/${slug}.md`);
  }

  get slug(): string {
    return this.value.slice(this.value.lastIndexOf("/") + 1, -".md".length);
  }

  equals(other: PagePath): boolean {
    return this.value === other.value;
  }
}
