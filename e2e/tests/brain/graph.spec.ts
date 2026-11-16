import { expect, test } from "../../fixtures/chat";

// E7-US01: the brain graph draws the in-memory brain and picks up a new page while it's open.
test.describe("brain graph", () => {
  test("the sidebar opens the graph, which shows the index and its pages", async ({
    signedIn: chat,
  }) => {
    await chat.page.getByTestId("chat-link-brain").click();
    await expect(chat.page.getByTestId("brain-panel-graph")).toBeVisible();
    await expect(chat.page.getByTestId("brain-node-index")).toBeVisible();
    await expect(chat.page.getByTestId("brain-node-welcome")).toBeVisible();
    await expect(chat.page.getByTestId("brain-text-status")).toContainText("live");
  });

  test("a page saved from the chat appears in the open graph", async ({ signedIn: chat }) => {
    const graph = await chat.page.context().newPage();
    await graph.goto("/brain");
    await expect(graph.getByTestId("brain-node-index")).toBeVisible();

    const word = `graph${Date.now()}`;
    await chat.send(`save note ${word}`);
    await expect(
      chat.page.getByText(new RegExp(`Saved: create wiki/note-${word}\\.md`)),
    ).toBeVisible();

    await expect(graph.getByTestId(`brain-node-note-${word}`)).toBeVisible({ timeout: 15_000 });
  });
});
