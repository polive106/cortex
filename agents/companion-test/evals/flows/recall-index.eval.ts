import { defineEval } from "eve/evals";

export default defineEval({
  description: "The brain index is recalled into the model input on every turn (E3-US06).",
  async test(t) {
    const turn = await t.send("what is indexed");
    turn.succeeded();
    turn.usedNoTools();
    turn.messageIncludes("Indexed: - [Welcome to the brain](wiki/welcome.md)");
  },
});
