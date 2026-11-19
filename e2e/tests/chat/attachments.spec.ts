import { readFileSync } from "node:fs";
import { expect, test } from "../../fixtures/chat";

const runbook = {
  name: "deploy-runbook.pdf",
  mimeType: "application/pdf",
  buffer: readFileSync("agents/companion-test/evals/data/deploy-runbook.pdf"),
};

// E3-US10: the composer attaches a PDF or an image, refuses anything else before sending, and
// the mockModel double saves the attachment under its file name (ADR-0011, no approval).
test.describe("attachments", () => {
  test("an attached PDF is sent, shown on the message, and saved", async ({ signedIn: chat }) => {
    await chat.page.getByTestId("chat-input-attachment").setInputFiles(runbook);
    await expect(chat.page.getByTestId("chat-chip-attachment-0")).toContainText(runbook.name);
    await chat.send("save attachment");
    await expect(chat.message(0)).toContainText(runbook.name);
    await expect(
      chat.page.getByText(/Saved: (create|update) wiki\/deploy-runbook\.md/),
    ).toBeVisible();
    await expect(chat.page.getByTestId("chat-chip-attachment-0")).toHaveCount(0);
    await expect(chat.approvalCard).toHaveCount(0);
  });

  test("a file can be removed before sending", async ({ signedIn: chat }) => {
    await chat.page.getByTestId("chat-input-attachment").setInputFiles(runbook);
    await chat.page.getByTestId("chat-btn-remove-attachment-0").click();
    await expect(chat.page.getByTestId("chat-chip-attachment-0")).toHaveCount(0);
  });

  test("a file over 3 MB is refused before anything is sent", async ({ signedIn: chat }) => {
    await chat.page.getByTestId("chat-input-attachment").setInputFiles({
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(3 * 1024 * 1024 + 1),
    });
    await expect(chat.page.getByTestId("chat-text-attachment-error")).toContainText(
      "Files must be 3 MB or less",
    );
    await expect(chat.page.getByTestId("chat-chip-attachment-0")).toHaveCount(0);
  });

  test("a file of another type is refused", async ({ signedIn: chat }) => {
    await chat.page.getByTestId("chat-input-attachment").setInputFiles({
      name: "table.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("a,b\n1,2\n"),
    });
    await expect(chat.page.getByTestId("chat-text-attachment-error")).toContainText(
      "Only PDF, PNG, JPEG, GIF, or WebP",
    );
  });
});
