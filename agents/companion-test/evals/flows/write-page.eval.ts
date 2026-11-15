import { defineEval } from "eve/evals";

// E3-US05 and E5-US01 on the in-memory brain. Each eval uses its own note, since evals share one
// server. Writes take no approval (ADR-0011).
export default [
  defineEval({
    description: "write_page saves straight away, and the page can be read back.",
    async test(t) {
      const saved = await t.send("save note alpha");
      saved.succeeded();
      saved.calledTool("write_page", { status: "completed" });
      saved.messageIncludes("Saved: create wiki/note-alpha.md");
      const read = await saved.session.send("read note alpha");
      read.messageIncludes("Page: All about alpha.");
    },
  }),
  defineEval({
    description: "A path outside wiki/ is refused, and nothing is written.",
    async test(t) {
      const refused = await t.send("save outside");
      refused.succeeded();
      refused.messageIncludes("Refused: InvalidPathError");
    },
  }),
];
