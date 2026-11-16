import { expect, test } from "../../fixtures/chat";

// E7-US02: the brain panel opens beside the chat and follows the agent's path through the brain.
test.describe("brain trail", () => {
  test("the panel opens on brain use and marks the page the agent read", async ({
    signedIn: chat,
  }) => {
    await chat.send("walk brain");
    const panel = chat.page.getByTestId("chat-panel-brain");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByTestId("brain-node-welcome").getByTestId("brain-ring-latest"),
    ).toBeVisible();
    await expect(chat.page.getByTestId("chat-text-brain-steps")).toContainText("step");

    // E7-US03: the panel follows the agent, until the person turns it off or moves the view.
    const graph = chat.page.getByTestId("chat-graph-brain");
    await expect(graph).toHaveAttribute("data-following", "true");
    const follow = chat.page.getByTestId("chat-btn-brain-follow");
    await follow.click();
    await expect(follow).toHaveAttribute("aria-pressed", "false");
    await expect(graph).toHaveAttribute("data-following", "false");
    await follow.click();
    await expect(graph).toHaveAttribute("data-following", "true");

    await chat.page.getByTestId("chat-btn-brain-close").click();
    await expect(panel).toBeHidden();
    await chat.page.getByTestId("chat-btn-brain-open").click();
    await expect(panel).toBeVisible();
  });

  test("a page the agent writes appears in the panel as the latest step", async ({
    signedIn: chat,
  }) => {
    const word = `trail${Date.now()}`;
    await chat.send(`save note ${word}`);
    const node = chat.page.getByTestId("chat-panel-brain").getByTestId(`brain-node-note-${word}`);
    await expect(node).toBeVisible({ timeout: 15_000 });
    await expect(node.getByTestId("brain-ring-latest")).toBeVisible();
  });
});
