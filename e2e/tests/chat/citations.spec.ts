import { expect, test } from "../../fixtures/chat";

// E3-US08: the mockModel double answers from wiki/welcome.md and cites it; the reply renders the
// citation as a link to the page in the brain repo on GitHub.
test.describe("citations", () => {
  test("a cited page links to the brain on GitHub", async ({ signedIn: chat }) => {
    await chat.send("cite welcome");
    const citation = chat.page.getByTestId("chat-link-citation-welcome");
    await expect(citation).toHaveText("Welcome to the brain");
    await expect(citation).toHaveAttribute(
      "href",
      "https://github.com/acme/brain/blob/main/wiki/welcome.md",
    );
    await expect(citation).toHaveAttribute("target", "_blank");
  });
});
