import { expect, test } from "../../fixtures/chat";

// E3-US07: the mockModel double fetches a sample page (SOURCE_FETCHER=memory, no network) and
// saves it straight away (ADR-0011). Tests share one brain, so the page may already exist.
test.describe("ingest", () => {
  test("a pasted URL is fetched and saved without approval", async ({ signedIn: chat }) => {
    await chat.send("save url https://example.com/post");
    await expect(
      chat.page.getByText(/Saved: (create|update) wiki\/shipping-on-fridays\.md/),
    ).toBeVisible();
    await expect(chat.approvalCard).toHaveCount(0);
  });

  test("a private address is refused", async ({ signedIn: chat }) => {
    await chat.send("save url http://169.254.169.254/latest/meta-data/");
    await expect(chat.page.getByText("Refused: BlockedAddressError")).toBeVisible();
  });
});
