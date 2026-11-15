import { defineEval } from "eve/evals";

// E5-US07 on the in-memory brain: the page is written in the sandbox, then published as a
// version. Each eval uses its own slug, since evals share one server.
export default [
  defineEval({
    description: "Making then revising an artifact publishes versions 1 and 2, without approval.",
    async test(t) {
      const made = await t.send("make artifact alpha");
      made.succeeded();
      made.calledTool("bash", { status: "completed" });
      made.calledTool("publish_artifact", { status: "completed" });
      made.messageIncludes("Published: out/alpha.html v1");
      const revised = await made.session.send("revise artifact alpha");
      revised.succeeded();
      revised.messageIncludes("Published: out/alpha.html v2");
    },
  }),
  defineEval({
    description: "Publishing with no page in the sandbox says where to write it.",
    async test(t) {
      const refused = await t.send("publish missing");
      refused.succeeded();
      refused.messageIncludes(
        "Refused: InvalidArtifactError: Write the page to artifacts/missing/index.html first",
      );
    },
  }),
];
