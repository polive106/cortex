import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { usage } from "eve/events";

export default defineEval({
  description: "A second turn reads the system prompt and history from Anthropic's prompt cache.",
  tags: ["real-model", "cost"],
  async test(t) {
    const first = await t.send("hi");
    first.succeeded();
    const second = await first.session.send("What can you help me with? One sentence.");
    second.succeeded();
    const { total } = usage(second.view);
    t.check(
      total.cacheReadTokens,
      satisfies((tokens: number) => tokens > 0, "cache-read input tokens > 0"),
    );
  },
});
