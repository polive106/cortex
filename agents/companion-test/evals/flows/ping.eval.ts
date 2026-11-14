import { defineEval } from "eve/evals";

export default defineEval({
  description: "The mock agent answers ping with pong, with no tool calls.",
  async test(t) {
    await t.send("ping");
    t.succeeded();
    t.usedNoTools();
    t.messageIncludes("pong");
  },
});
