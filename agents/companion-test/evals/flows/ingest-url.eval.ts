import { defineEval } from "eve/evals";

// E3-US07 on the in-memory brain and the sample pages (SOURCE_FETCHER=memory): no network.
export default [
  defineEval({
    description: "A URL is fetched and saved under its URL as origin, without approval.",
    async test(t) {
      const saved = await t.send("save url https://example.com/post");
      saved.succeeded();
      saved.calledTool("fetch_source", { output: { url: "https://example.com/post" } });
      saved.calledTool("write_page", {
        status: "completed",
        input: { source: { origin: "https://example.com/post" } },
      });
      saved.messageIncludes("wiki/shipping-on-fridays.md");
    },
  }),
  defineEval({
    description: "A private address is refused before anything is fetched or saved.",
    async test(t) {
      const refused = await t.send("save url http://169.254.169.254/latest/meta-data/");
      refused.succeeded();
      refused.messageIncludes("Refused: BlockedAddressError");
    },
  }),
];
