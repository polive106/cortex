import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EveMessage } from "eve/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrainTrailPreview } from "./brain-trail-preview";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const graph = {
  ok: true,
  ref: "memory-0",
  nodes: [
    { id: "index.md", title: "Index", summary: "1 article", kind: "index", degree: 1 },
    { id: "wiki/welcome.md", title: "Welcome", summary: "", kind: "page", degree: 1 },
  ],
  edges: [{ source: "index.md", target: "wiki/welcome.md" }],
};

const reading = [
  {
    id: "m1",
    role: "assistant",
    parts: [
      {
        type: "tool",
        callId: "c1",
        stepIndex: 0,
        kind: "tool",
        name: "read_page",
        label: "read",
        state: "running",
        input: { path: "wiki/welcome.md" },
      },
    ],
  },
] as unknown as EveMessage[];

describe("BrainTrailPreview", () => {
  it("renders nothing until the agent uses the brain", () => {
    const { container } = render(<BrainTrailPreview agent="companion" messages={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("opens on the first step and marks the page the agent is reading", async () => {
    const fetch = vi.fn(async () => Response.json(graph));
    vi.stubGlobal("fetch", fetch);
    render(<BrainTrailPreview agent="companion" busy messages={reading} pollMs={60_000} />);
    expect(screen.getByTestId("chat-panel-brain")).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("brain-node-welcome")).toBeTruthy());
    expect(screen.getByTestId("chat-graph-brain").getAttribute("data-following")).toBe("true");
    fireEvent.click(screen.getByTestId("chat-btn-brain-follow"));
    expect(screen.getByTestId("chat-graph-brain").getAttribute("data-following")).toBe("false");
    expect(screen.getByTestId("brain-ring-latest")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/eve/companion/brain/graph", expect.anything());

    const panel = screen.getByTestId("chat-panel-brain");
    fireEvent.click(screen.getByTestId("chat-btn-brain-close"));
    // Closed, the panel stays mounted (the graph survives) but is out of sight.
    expect(panel.getAttribute("data-hidden")).toBe("true");
    expect(screen.getByTestId("brain-node-welcome")).toBeTruthy();
    fireEvent.click(screen.getByTestId("chat-btn-brain-open"));
    expect(panel.getAttribute("data-hidden")).toBe("false");
    expect(screen.queryByTestId("chat-btn-brain-open")).toBeNull();
  });

  it("waits behind its button while the artifact preview is open", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(graph)),
    );
    render(<BrainTrailPreview agent="companion" artifact="open" messages={reading} />);
    expect(screen.getByTestId("chat-panel-brain").getAttribute("data-hidden")).toBe("true");
    expect(screen.getByTestId("chat-btn-brain-open").className).toContain("right-36");
  });

  it("reads the page the agent is on, and the node the person clicks", async () => {
    const fetch = vi.fn(async (url: string) => {
      if (!url.includes("/brain/page")) return Response.json(graph);
      const path = new URL(url, "http://x").searchParams.get("path") ?? "";
      return Response.json({ ...page, path, title: path === "index.md" ? "Index" : "Welcome" });
    });
    vi.stubGlobal("fetch", fetch);
    render(<BrainTrailPreview agent="companion" busy messages={reading} pollMs={60_000} />);
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("Welcome"),
    );
    await waitFor(() => expect(screen.getByTestId("brain-node-index")).toBeTruthy());
    fireEvent.click(screen.getByTestId("brain-node-index"));
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("Index"),
    );
    fireEvent.click(screen.getByTestId("chat-btn-reader-back"));
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("Welcome"),
    );
  });

  it("opens on a page asked for from the chat, before the agent used the brain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/brain/page") ? Response.json(page) : Response.json(graph),
      ),
    );
    render(
      <BrainTrailPreview
        agent="companion"
        messages={[]}
        page={{ path: "wiki/welcome.md", id: 1 }}
        pollMs={60_000}
      />,
    );
    expect(screen.getByTestId("chat-panel-brain").getAttribute("data-hidden")).toBe("false");
    expect(screen.getByTestId("chat-text-brain-steps").textContent).toBe(
      "0 steps this conversation",
    );
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("Welcome"),
    );
  });
});

const page = {
  ok: true,
  ref: "memory-0",
  path: "wiki/welcome.md",
  title: "Welcome",
  summary: "",
  updated: "",
  body: "Hello",
};
