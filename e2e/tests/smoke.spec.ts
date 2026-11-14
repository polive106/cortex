import { expect, test } from "../fixtures/chat";

test("a signed-in user sends a message and sees the mock reply", async ({ signedIn: chat }) => {
  await chat.send("ping");
  await expect(chat.message(0)).toContainText("ping");
  await expect(chat.message(1)).toContainText("pong");
});
