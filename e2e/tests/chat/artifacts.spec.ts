import { expect, test } from "../../fixtures/chat";

// E5-US06/E5-US07: the mockModel double writes artifacts/<slug>/index.html in its sandbox and
// publishes it; the panel shows the page in a sandboxed frame, one entry per version.
test.describe("artifacts", () => {
  test("a published artifact opens in the panel, and revisions are versions", async ({
    signedIn: chat,
  }) => {
    const slug = `e2e-${test.info().parallelIndex}-${Date.now()}`;
    await chat.send(`make artifact ${slug}`);
    await expect(chat.page.getByText(`Published: out/${slug}.html v1`)).toBeVisible();
    await expect(chat.artifactPanel).toBeVisible();
    await expect(chat.page.getByTestId("chat-frame-artifact")).toHaveAttribute(
      "sandbox",
      "allow-scripts",
    );
    const revision = chat.artifactFrame().locator("[data-revision]");
    await expect(revision).toHaveText("Revision 1");

    await chat.send(`revise artifact ${slug}`);
    await expect(chat.page.getByText(`Published: out/${slug}.html v2`)).toBeVisible();
    await expect(revision).toHaveText("Revision 2");
    await expect(chat.artifactVersion.locator("option")).toHaveText(["v1", "v2"]);

    const v1 = await chat.artifactVersion.locator("option").first().getAttribute("value");
    await chat.artifactVersion.selectOption(v1 ?? "");
    await expect(revision).toHaveText("Revision 1");
  });

  test("the panel closes and reopens", async ({ signedIn: chat }) => {
    const slug = `e2e-close-${test.info().parallelIndex}-${Date.now()}`;
    await chat.send(`make artifact ${slug}`);
    await expect(chat.artifactPanel).toBeVisible();
    await chat.page.getByTestId("chat-btn-artifact-close").click();
    await expect(chat.artifactPanel).toBeHidden();
    await chat.page.getByTestId("chat-btn-artifact-open").click();
    await expect(chat.artifactFrame().locator("[data-revision]")).toHaveText("Revision 1");
  });
});
