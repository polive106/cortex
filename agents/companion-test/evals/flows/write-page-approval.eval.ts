import { defineEval } from "eve/evals";

// E3-US05 on the in-memory brain. Each eval uses its own note, since evals share one server.
export default [
  defineEval({
    description: "Approving write_page commits the page, and it can be read back.",
    async test(t) {
      const parked = await t.send("save note alpha");
      parked.awaitingInput();
      parked.session.requireInteraction({ toolName: "write_page" });
      const saved = await parked.session.respondAll("approve");
      saved.succeeded();
      saved.calledTool("write_page", { status: "completed" });
      saved.messageIncludes("Saved: create wiki/note-alpha.md");
      const read = await saved.session.send("read note alpha");
      read.messageIncludes("Page: All about alpha.");
    },
  }),
  defineEval({
    description: "Denying write_page writes nothing.",
    async test(t) {
      const parked = await t.send("save note beta");
      parked.awaitingInput();
      const denied = await parked.session.respondAll("deny");
      denied.succeeded();
      denied.messageIncludes("won't use write_page");
      const read = await denied.session.send("read note beta");
      read.messageIncludes("Refused: PageNotFoundError");
    },
  }),
  defineEval({
    description: "A path outside wiki/ is refused even when approved, and nothing is written.",
    async test(t) {
      const parked = await t.send("save outside");
      const refused = await parked.session.respondAll("approve");
      refused.succeeded();
      refused.messageIncludes("Refused: InvalidPathError");
    },
  }),
];
