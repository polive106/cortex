import { describe, expect, it } from "vitest";
import { InvalidArtifactError } from "../errors";
import { ARTIFACT_CSP, Artifact, MAX_SOURCE_LENGTH } from "./artifact";
import { ArtifactPath } from "./artifact-path";

const path = ArtifactPath.of("roadmap", "acme");
const doc = (body = "<h1>Hi</h1>", head = "<title>Roadmap</title>") =>
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n${head}\n</head>\n<body>${body}</body>\n</html>\n`;

describe("Artifact.create", () => {
  it("keeps the path, title, version and source", () => {
    const artifact = Artifact.create({ path, title: "Roadmap", version: 2, source: doc() });
    expect(artifact).toMatchObject({ path, title: "Roadmap", version: 2, source: doc() });
  });

  it.each([
    ["an empty source", "  "],
    ["an external script", doc('<script src="https://cdn.example/x.js"></script>')],
    ["an external stylesheet", doc("", '<link rel="stylesheet" href="https://x/y.css">')],
    ["a frame", doc('<iframe src="https://example.com"></iframe>')],
    ["an embed", doc('<embed src="a.swf">')],
    ["a base URL", doc("", '<base href="https://example.com/">')],
    ["an http-equiv meta", doc("", '<meta http-equiv="refresh" content="0;url=https://x">')],
    ["a source over the size limit", "x".repeat(MAX_SOURCE_LENGTH + 1)],
  ])("refuses %s", (_reason, source) => {
    expect(() => Artifact.create({ path, title: "R", version: 1, source })).toThrow(
      InvalidArtifactError,
    );
  });

  it("allows inline scripts and styles", () => {
    const source = doc("<script>document.title = 'x'</script><style>h1{color:red}</style>");
    expect(Artifact.create({ path, title: "R", version: 1, source }).source).toBe(source);
  });

  it("refuses a version below 1", () => {
    expect(() => Artifact.create({ path, title: "R", version: 0, source: doc() })).toThrow(
      InvalidArtifactError,
    );
  });
});

describe("Artifact.render", () => {
  const artifact = Artifact.create({ path, title: "Roadmap", version: 3, source: doc() });

  it("puts the CSP first in <head>, then the version and the CSS", () => {
    const html = artifact.render(".p-4{padding:1rem}");
    const head = html.slice(html.indexOf("<head>") + "<head>".length);
    expect(head.trimStart().startsWith("<!-- cortex:artifact -->")).toBe(true);
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">`);
    expect(html).toContain('<meta name="cortex:version" content="3">');
    expect(html).toContain("<style data-cortex-artifact>.p-4{padding:1rem}</style>");
    expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<title>"));
  });

  it("keeps a head with attributes", () => {
    const source = doc().replace("<head>", '<head data-x="1">');
    const html = Artifact.create({ path, title: "R", version: 1, source }).render("");
    expect(html).toMatch(/<head data-x="1">\n<!-- cortex:artifact -->/);
  });

  it("puts the CSS after the generated block when the head is never closed", () => {
    const source = "<html><head><title>T</title><body>x</body></html>";
    const artifact = Artifact.create({ path, title: "T", version: 1, source });
    const html = artifact.render(".x{}");
    expect(html).toContain("<!-- /cortex:artifact --><style data-cortex-artifact>.x{}</style>\n");
    expect(Artifact.parse(path, html).source).toBe(source);
  });

  it("adds a head to a document without one", () => {
    const source = '<html lang="en"><body><p>x</p></body></html>';
    const html = Artifact.create({ path, title: "Notes", version: 1, source }).render("");
    expect(html).toMatch(/^<html lang="en">\n<head>\n<!-- cortex:artifact -->/);
    expect(html).toContain("<title>Notes</title>");
  });

  it("wraps a fragment in a full document", () => {
    const html = Artifact.create({ path, title: "A & B", version: 1, source: "<p>x</p>" }).render(
      "",
    );
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain("<title>A &amp; B</title>");
    expect(html).toContain("<body>\n<p>x</p>\n</body>");
  });

  it("can't be closed early by the CSS", () => {
    const html = artifact.render("a{content:'</style><script>x</script>'}");
    expect(html).not.toContain("</style><script>");
  });
});

describe("Artifact.parse", () => {
  it("round-trips: the source comes back without the generated block", () => {
    const artifact = Artifact.create({ path, title: "Roadmap", version: 4, source: doc() });
    const parsed = Artifact.parse(path, artifact.render(".x{}"));
    expect(parsed).toMatchObject({ version: 4, title: "Roadmap", source: doc() });
  });

  it("round-trips a wrapped fragment to the full document it became", () => {
    const first = Artifact.create({ path, title: "F", version: 1, source: "<p>x</p>" });
    const parsed = Artifact.parse(path, first.render(""));
    const again = Artifact.create({ path, title: "F", version: 2, source: parsed.source });
    expect(Artifact.parse(path, again.render("")).source).toBe(parsed.source);
  });

  it("decodes the title once", () => {
    const html = "<title>A &amp;lt; B &amp; C</title>";
    expect(Artifact.parse(path, html).title).toBe("A &lt; B & C");
  });

  it("reads a hand-written file as version 0, titled by its slug", () => {
    expect(Artifact.parse(path, "<p>made by hand</p>")).toMatchObject({
      version: 0,
      title: "roadmap",
      source: "<p>made by hand</p>",
    });
  });
});
