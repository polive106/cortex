import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

const MAX_GREETING_CHARS = 280;

export default defineEval({
  description: "A greeting gets a short reply and no tool calls.",
  tags: ["smoke", "real-model"],
  async test(t) {
    const turn = await t.send("hi");
    t.succeeded();
    t.usedNoTools();
    t.check(
      turn.reply ?? "",
      satisfies(
        (reply: string) => reply.trim().length > 0 && reply.length <= MAX_GREETING_CHARS,
        `non-empty reply of at most ${MAX_GREETING_CHARS} characters`,
      ),
    );
  },
});
