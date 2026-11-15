import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EveMessage } from "eve/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtifactPreview } from "./artifact-preview";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const publish = (callId: string, version: number) =>
  ({
    id: `m-${callId}`,
    role: "assistant",
    metadata: {},
    parts: [
      {
        type: "tool",
        callId,
        name: "publish_artifact",
        state: "completed",
        output: { published: true, path: "out/a.html", title: "A", version, ref: `r${version}` },
      },
    ],
  }) as unknown as EveMessage;

describe("ArtifactPreview", () => {
  it("renders nothing before an artifact is published", () => {
    const { container } = render(<ArtifactPreview agent="companion" messages={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("opens on the newest version, switches versions, closes and reopens", async () => {
    const fetch = vi.fn(
      async (url: string) =>
        new Response(`<p>${new URL(url, "http://x").searchParams.get("ref")}</p>`),
    );
    vi.stubGlobal("fetch", fetch);
    render(<ArtifactPreview agent="companion" messages={[publish("c1", 1), publish("c2", 2)]} />);

    await waitFor(() =>
      expect(screen.getByTestId("chat-frame-artifact").getAttribute("srcdoc")).toBe("<p>r2</p>"),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/eve/companion/artifacts?path=out%2Fa.html&ref=r2",
      expect.anything(),
    );

    fireEvent.change(screen.getByTestId("chat-select-artifact-version"), {
      target: { value: "c1" },
    });
    await waitFor(() =>
      expect(screen.getByTestId("chat-frame-artifact").getAttribute("srcdoc")).toBe("<p>r1</p>"),
    );

    fireEvent.click(screen.getByTestId("chat-btn-artifact-close"));
    expect(screen.queryByTestId("chat-panel-artifact")).toBeNull();
    fireEvent.click(screen.getByTestId("chat-btn-artifact-open"));
    expect(screen.getByTestId("chat-panel-artifact")).toBeTruthy();
  });
});
