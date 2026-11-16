import { defineEval } from "eve/evals";

// E3-US08: an answer drawn from a page cites it as [Title](wiki/path.md). The real-model check
// that companion does this on its own is the "cites pages" case of E3-US09.
export default defineEval({
  description: "An answer read from a page links that page as a citation.",
  async test(t) {
    const answer = await t.send("cite welcome");
    answer.succeeded();
    answer.calledTool("read_page", { input: { path: "wiki/welcome.md" } });
    answer.messageIncludes("[Welcome to the brain](wiki/welcome.md)");
  },
});
