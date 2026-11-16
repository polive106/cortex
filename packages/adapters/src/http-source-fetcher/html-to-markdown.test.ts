import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "./html-to-markdown";

const BASE = "https://example.com/blog/post";

describe("htmlToMarkdown", () => {
  it("takes the title from og:title, then <title>, then the first h1, then the host", () => {
    expect(
      htmlToMarkdown(
        `<head><meta property="og:title" content="OG &amp; title"><title>Doc</title></head>`,
        BASE,
      ).title,
    ).toBe("OG & title");
    expect(htmlToMarkdown("<title>\n  Doc   title </title><h1>H</h1>", BASE).title).toBe(
      "Doc title",
    );
    expect(htmlToMarkdown("<body><h1>Heading <em>one</em></h1></body>", BASE).title).toBe(
      "Heading one",
    );
    expect(htmlToMarkdown("<p>no title</p>", BASE).title).toBe("example.com");
  });

  it("keeps the article and drops scripts, styles, navigation, and comments", () => {
    const html = `<html><head><style>p{}</style><script>alert(1)</script></head><body>
      <nav><a href="/">Home</a></nav><!-- secret -->
      <article><h2>Part</h2><p>Kept <b>text</b>.</p><script>evil()</script></article>
      <footer>Footer</footer></body></html>`;
    const { text } = htmlToMarkdown(html, BASE);
    expect(text).toBe("## Part\n\nKept text.");
  });

  it("falls back to <main>, then <body>, then the whole document", () => {
    expect(htmlToMarkdown("<body><p>Out</p><main><p>In</p></main></body>", BASE).text).toBe("In");
    expect(htmlToMarkdown("<head><title>T</title></head><body><p>B</p></body>", BASE).text).toBe(
      "B",
    );
    expect(htmlToMarkdown("plain <i>words</i>", BASE).text).toBe("plain words");
  });

  it("converts headings, paragraphs, lists, line breaks, and inline code", () => {
    const html =
      "<body><h1>Title</h1><p>One<br>two</p><ul><li>a</li><li>b <code>x</code></li></ul><h3>Sub</h3><div>End</div></body>";
    expect(htmlToMarkdown(html, BASE).text).toBe(
      "# Title\n\nOne\ntwo\n\n- a\n- b `x`\n\n### Sub\n\nEnd",
    );
  });

  it("keeps preformatted code as a fenced block, whitespace intact", () => {
    const html = "<body><p>Run:</p><pre><code>if (a &lt; b) {\n  go();\n}</code></pre></body>";
    expect(htmlToMarkdown(html, BASE).text).toBe("Run:\n\n```\nif (a < b) {\n  go();\n}\n```");
  });

  it("writes web links as absolute Markdown links and drops other links and images", () => {
    const html = `<body><p><a href="/docs">Docs</a>, <a href="https://x.test/a?b=1">X</a>,
      <a href="javascript:alert(1)">bad</a>, <a href="#top">top</a>, <a href="/empty"></a>
      <img src="https://tracker.test/p.gif" alt="pixel"></p></body>`;
    expect(htmlToMarkdown(html, BASE).text).toBe(
      "[Docs](https://example.com/docs), [X](https://x.test/a?b=1), bad, top,",
    );
  });

  it("decodes entities after removing tags, so escaped markup stays text", () => {
    const html =
      "<p>&lt;script&gt; &amp; &quot;q&quot; &#39;s&#39; &#x2014; &mdash; &nbsp;x &copy; &unknown;</p>";
    expect(htmlToMarkdown(html, BASE).text).toBe(`<script> & "q" 's' — — x © &unknown;`);
  });

  it("ignores invalid numeric entities", () => {
    expect(htmlToMarkdown("<p>&#xFFFFFFF; &#0;</p>", BASE).text).toBe("&#xFFFFFFF; &#0;");
  });
});
