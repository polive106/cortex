import { test as base, expect, type Locator, type Page } from "@playwright/test";

/** The chat screen, driven only through data-testid selectors ({page}-{type}-{name}). */
export class ChatPage {
  readonly input: Locator;
  readonly approvalCard: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByTestId("chat-input-message");
    this.approvalCard = page.getByTestId("chat-card-approval");
  }

  message(index: number): Locator {
    return this.page.getByTestId(`chat-row-message-${index}`);
  }

  async send(text: string): Promise<void> {
    await this.input.fill(text);
    await this.page.getByTestId("chat-btn-send").click();
  }

  /** Answers the open approval with an option id ("approve" or "deny"). */
  async respond(optionId: string): Promise<void> {
    await this.approvalCard.getByTestId(`chat-btn-${optionId}`).click();
  }
}

/**
 * `signedIn` opens the chat as a signed-in, allowlisted user. Locally the web app and the agent
 * channel accept the session through eve's localDev() (ADR-0006), so no OAuth round trip is needed.
 * Production sign-in is covered by the deployed smoke checks instead.
 */
export const test = base.extend<{ signedIn: ChatPage }>({
  signedIn: async ({ page }, use) => {
    const chat = new ChatPage(page);
    await page.goto("/");
    await expect(chat.input).toBeVisible();
    await use(chat);
  },
});

export { expect };
