import type { ArtifactBuilder } from "@cortex/domain";

/** ArtifactBuilder twin for tests: fixed CSS, and the pages it was asked to build. */
export class InMemoryArtifactBuilder implements ArtifactBuilder {
  readonly built: string[] = [];

  constructor(private readonly output = "/* in-memory build */") {}

  async css(html: string): Promise<string> {
    this.built.push(html);
    return this.output;
  }
}
