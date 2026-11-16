import { defineEval } from "eve/evals";

// E7-US02: the brain panel's trail comes from these calls: a search, then a read of a hit.
export default defineEval({
  description: "A search followed by a read gives the brain panel a trail to draw.",
  async test(t) {
    const answer = await t.send("walk brain");
    answer.succeeded();
    answer.calledTool("search_wiki", { input: { query: "brain" } });
    answer.calledTool("read_page", { input: { path: "wiki/welcome.md" } });
  },
});
