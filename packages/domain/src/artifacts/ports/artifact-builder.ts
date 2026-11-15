/** Builds the CSS a page needs from the classes it uses (Tailwind on the design kit, ADR-0012). */
export interface ArtifactBuilder {
  css(html: string): Promise<string>;
}
