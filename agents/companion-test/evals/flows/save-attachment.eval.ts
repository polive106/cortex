import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

// E3-US10 on the in-memory brain: an attached file reaches the agent, and saving it records
// `upload:<file name>` as the source's origin. The double can't read a PDF, so its capture is a
// stand-in; the real-model capture is checked in E3-US09.
export default [
  defineEval({
    description: "An attached PDF is saved with its file name as the origin, without approval.",
    async test(t) {
      const session = await t.session();
      const saved = await session.sendFile(
        "save attachment",
        "agents/companion-test/evals/data/deploy-runbook.pdf",
        "application/pdf",
      );
      saved.succeeded();
      saved.calledTool("write_page", {
        status: "completed",
        input: { source: { origin: "upload:deploy-runbook.pdf" } },
      });
      saved.messageIncludes("wiki/deploy-runbook.md");
    },
  }),
  defineEval({
    description: "An attached image reaches the agent, which answers without saving.",
    async test(t) {
      const session = await t.session();
      const asked = await session.sendFile(
        "what is attached",
        "agents/companion-test/evals/data/pixel.png",
        "image/png",
      );
      asked.succeeded();
      asked.messageIncludes("Attached: pixel.png (image/png)");
      asked.notCalledTool("write_page");
    },
  }),
  defineEval({
    description: "The channel refuses a file type the composer doesn't offer.",
    async test(t) {
      const session = await t.session();
      const refusal = await session
        .sendFile("save attachment", "agents/companion-test/evals/data/table.csv", "text/csv")
        .then(
          () => "accepted",
          (error: unknown) => String(error),
        );
      t.check(refusal, includes("is not allowed by this route"));
      t.notCalledTool("write_page");
    },
  }),
];
