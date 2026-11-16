import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrainGraphView } from "./brain-graph-view";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const body = {
  ok: true,
  ref: "memory-0",
  nodes: [
    { id: "index.md", title: "Index", summary: "2 articles", kind: "index", degree: 1 },
    { id: "wiki/churn.md", title: "Churn", summary: "", kind: "page", degree: 2 },
    { id: "wiki/pricing.md", title: "Pricing", summary: "", kind: "page", degree: 1 },
  ],
  edges: [
    { source: "index.md", target: "wiki/churn.md" },
    { source: "wiki/churn.md", target: "wiki/pricing.md" },
  ],
};

describe("BrainGraphView", () => {
  it("draws the brain from the agent's route, opens a page on GitHub, and searches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(body)),
    );
    const open = vi.fn();
    vi.stubGlobal("open", open);
    render(<BrainGraphView agent="companion" pollMs={60_000} />);
    await waitFor(() => expect(screen.getByTestId("brain-node-churn")).toBeTruthy());
    expect(screen.getByTestId("brain-text-count").textContent).toBe("2 pages · 2 links");

    fireEvent.click(screen.getByTestId("brain-node-pricing"));
    expect(open).toHaveBeenCalledWith(
      "https://github.com/polive106/brain/blob/main/wiki/pricing.md",
      "_blank",
      "noopener,noreferrer",
    );

    const search = screen.getByTestId("brain-input-search");
    fireEvent.change(search, { target: { value: "pric" } });
    expect(screen.getByTestId("brain-node-churn").getAttribute("opacity")).toBe("0.18");
    fireEvent.submit(search);
    fireEvent.change(search, { target: { value: "nothing" } });
    fireEvent.submit(search);
  });

  it("says why when the brain can't be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 401 })),
    );
    render(<BrainGraphView agent="companion" pollMs={60_000} />);
    await waitFor(() =>
      expect(screen.getByTestId("brain-text-error").textContent).toBe(
        "Couldn't load the brain (401)",
      ),
    );
  });
});
