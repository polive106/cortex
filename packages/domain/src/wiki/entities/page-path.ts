import { InvalidPathError } from "../errors";
import { KEBAB, slugify } from "./text";

const SEGMENT = new RegExp(`^${KEBAB}$`);

/** A validated location of a wiki page: `wiki/<kebab-segments>.md`. Nothing escapes `wiki/`. */
export class PagePath {
  private constructor(readonly value: string) {}

  static parse(input: string): PagePath {
    if (!input.startsWith("wiki/")) throw new InvalidPathError(input, "must live under wiki/");
    if (!input.endsWith(".md")) throw new InvalidPathError(input, "must be a .md file");
    const segments = input.slice("wiki/".length, -".md".length).split("/");
    if (!segments.every((segment) => SEGMENT.test(segment))) {
      throw new InvalidPathError(input, "segments must be lowercase kebab-case");
    }
    return new PagePath(input);
  }

  /** The parsed path, or undefined when `input` isn't a valid page path. */
  static tryParse(input: string): PagePath | undefined {
    try {
      return PagePath.parse(input);
    } catch {
      return undefined;
    }
  }

  static fromTitle(title: string): PagePath {
    return PagePath.parse(`wiki/${slugify(title)}.md`);
  }

  get slug(): string {
    return this.value.slice(this.value.lastIndexOf("/") + 1, -".md".length);
  }

  equals(other: PagePath): boolean {
    return this.value === other.value;
  }
}
