import type { Locator } from "@playwright/test";
import { expect, test } from "../../fixtures/chat";

/** A node's own disc: the middle of its group can be empty space between the disc and label. */
const clickNode = (node: Locator) => node.locator("circle").last().click();

// E7-US04: the brain panel reads pages under the graph, and so does the full /brain view.
test.describe("brain reader", () => {
  test("the reader follows the agent, opens clicked nodes and links, and goes back", async ({
    signedIn: chat,
  }) => {
    await chat.send("walk brain");
    const reader = chat.page.getByTestId("chat-panel-reader");
    await expect(reader).toBeVisible();
    await expect(chat.page.getByTestId("chat-text-reader-title")).toHaveText(
      "Welcome to the brain",
    );

    const panel = chat.page.getByTestId("chat-panel-brain");
    await clickNode(panel.getByTestId("brain-node-index"));
    await expect(chat.page.getByTestId("chat-text-reader-title")).toHaveText("Index");

    await reader.getByTestId("chat-btn-reader-page-welcome").click();
    await expect(chat.page.getByTestId("chat-text-reader-title")).toHaveText(
      "Welcome to the brain",
    );
    await chat.page.getByTestId("chat-btn-reader-back").click();
    await expect(chat.page.getByTestId("chat-text-reader-title")).toHaveText("Index");
  });

  test("a citation in a reply opens the page in the brain panel", async ({ signedIn: chat }) => {
    await chat.send("cite welcome");
    const citation = chat.page.getByTestId("chat-link-citation-welcome");
    await expect(citation).toBeVisible();
    await chat.page.getByTestId("chat-btn-brain-close").click();
    await expect(chat.page.getByTestId("chat-panel-brain")).toBeHidden();

    await citation.click();
    await expect(chat.page.getByTestId("chat-panel-brain")).toBeVisible();
    await expect(chat.page.getByTestId("chat-text-reader-title")).toHaveText(
      "Welcome to the brain",
    );
  });

  test("the full graph opens a page in its reader", async ({ signedIn: chat }) => {
    await chat.page.goto("/brain");
    await clickNode(chat.page.getByTestId("brain-node-welcome"));
    await expect(chat.page.getByTestId("brain-panel-reader")).toBeVisible();
    await expect(chat.page.getByTestId("brain-text-reader-title")).toHaveText(
      "Welcome to the brain",
    );
    await chat.page.getByTestId("brain-btn-reader-close").click();
    await expect(chat.page.getByTestId("brain-panel-reader")).toBeHidden();
  });
});
