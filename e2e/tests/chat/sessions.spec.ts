import { expect, test } from "../../fixtures/chat";

// E6-US03: companion-test records each web session in the in-memory index (ADR-0013); the
// sidebar lists it under its first message, reopens it, renames it, and deletes it.
//
// Unlike the other specs, this one loads several pages (/s/<id>, /s, /s/<id> again, a reload).
// Under vercel dev each first load can compile the route, and reopening a session replays its
// stream, so on CI runners it needs more than the default budget.
const AFTER_LOAD = { timeout: 15_000 };

test("a session is listed, reopened, renamed, and deleted from the sidebar", async ({
  signedIn: chat,
}) => {
  test.slow();
  const page = chat.page;
  const title = `history ${test.info().parallelIndex}-${Date.now()}`;
  await chat.send(title);
  await expect(chat.message(1)).toContainText(title, AFTER_LOAD);
  await expect(page).toHaveURL(/\/s\/[^/]+$/);
  const sessionUrl = page.url();

  const row = chat.sessionRow(title);
  await expect(row).toBeVisible(AFTER_LOAD);
  await expect(row.locator('[data-testid^="chat-link-session-"]')).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Reopen it from a new chat.
  await page.getByTestId("chat-link-sessions-new").click();
  await expect(page).toHaveURL(/\/s$/, AFTER_LOAD);
  await chat.sessionRow(title).locator('[data-testid^="chat-link-session-"]').click();
  await expect(page).toHaveURL(sessionUrl, AFTER_LOAD);
  await expect(chat.message(0)).toContainText(title, AFTER_LOAD);

  // Rename it; the new title is kept on the server.
  const renamed = `renamed ${title}`;
  await chat.sessionRow(title).locator('[data-testid^="chat-btn-session-rename-"]').click();
  const input = page.getByTestId("chat-input-session-title");
  await input.fill(renamed);
  await input.press("Enter");
  await expect(chat.sessionRow(renamed)).toBeVisible();
  await page.reload();
  await expect(chat.sessionRow(renamed)).toBeVisible(AFTER_LOAD);

  // Delete the open session: it leaves the list and the chat starts fresh.
  await chat.sessionRow(renamed).locator('[data-testid^="chat-btn-session-delete-"]').click();
  await page.getByTestId("chat-btn-session-delete-confirm").click();
  await expect(page).toHaveURL(/\/s$/, AFTER_LOAD);
  await expect(chat.sessionRow(renamed)).toHaveCount(0);
});

test("the sidebar hides and shows", async ({ signedIn: chat }) => {
  const panel = chat.page.getByTestId("chat-panel-sessions");
  await expect(panel).toBeVisible();
  await chat.page.getByTestId("chat-btn-sessions-close").click();
  await expect(panel).toBeHidden();
  await chat.page.getByTestId("chat-btn-sessions-open").click();
  await expect(panel).toBeVisible();
});
