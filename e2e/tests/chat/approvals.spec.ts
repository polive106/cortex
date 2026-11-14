import { expect, test } from "../../fixtures/chat";

test.describe("approvals", () => {
  test.beforeEach(async ({ signedIn: chat }) => {
    await chat.send("demo approval");
    await expect(chat.approvalCard.getByTestId("chat-text-approval-prompt")).toHaveText(
      "Approve Demo action?",
    );
    await expect(chat.approvalCard.getByTestId("chat-list-approval-input")).toContainText(
      "label: demo",
    );
    await expect(chat.input).toHaveAttribute("placeholder", "Waiting for your answer…");
  });

  test("approving runs the tool and the agent continues", async ({ signedIn: chat }) => {
    await chat.respond("approve");
    await expect(chat.approvalCard.getByTestId("chat-text-approval-result")).toBeVisible();
    await expect(chat.page.getByText("Demo action done")).toBeVisible();
  });

  test("denying skips the tool and the agent acknowledges", async ({ signedIn: chat }) => {
    await chat.respond("deny");
    await expect(chat.approvalCard.getByTestId("chat-text-approval-result")).toBeVisible();
    await expect(chat.page.getByText("won't run the demo action")).toBeVisible();
  });
});
