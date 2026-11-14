import { InvalidPathError } from "../errors";
import { isoDate, KEBAB, slugify } from "./text";

const SOURCE = new RegExp(`^raw/(\\d{4}-\\d{2}-\\d{2})-${KEBAB}\\.md$`);

/** A validated immutable source location: `raw/YYYY-MM-DD-<slug>.md`. */
export class SourcePath {
  private constructor(readonly value: string) {}

  static parse(input: string): SourcePath {
    const match = SOURCE.exec(input);
    if (!match) throw new InvalidPathError(input, "must be raw/YYYY-MM-DD-<kebab-slug>.md");
    const date = match[1] as string;
    if (Number.isNaN(Date.parse(date)) || isoDate(new Date(date)) !== date) {
      throw new InvalidPathError(input, "has an invalid date");
    }
    return new SourcePath(input);
  }

  static forTitle(date: Date, title: string): SourcePath {
    return SourcePath.parse(`raw/${isoDate(date)}-${slugify(title)}.md`);
  }
}
