import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArtifactVersion } from "../api";
import { ArtifactPanel } from "./artifact-panel";

afterEach(cleanup);

const v1: ArtifactVersion = {
  id: "c1",
  path: "out/plan.html",
  title: "Plan",
  version: 1,
  ref: "a",
};
const v2: ArtifactVersion = { ...v1, id: "c2", version: 2, ref: "b" };

const panel = (props: Partial<Parameters<typeof ArtifactPanel>[0]> = {}) =>
  render(
    <ArtifactPanel
      onClose={vi.fn()}
      onSelect={vi.fn()}
      page={{ status: "ready", html: "<p>page</p>" }}
      selected={v2}
      versions={[v1, v2]}
      {...props}
    />,
  );

describe("ArtifactPanel", () => {
  it("shows the page in a sandbox with scripts but never the app's origin", () => {
    panel();
    const frame = screen.getByTestId("chat-frame-artifact");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("srcdoc")).toBe("<p>page</p>");
    expect(frame.getAttribute("title")).toBe("Plan v2");
    expect(screen.getByTestId("chat-text-artifact-title").textContent).toBe("Plan");
  });

  it("lists the versions and reports a pick", () => {
    const onSelect = vi.fn();
    panel({ onSelect });
    const select = screen.getByTestId("chat-select-artifact-version") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["v1", "v2"]);
    expect(select.value).toBe("c2");
    fireEvent.change(select, { target: { value: "c1" } });
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("names each artifact when the conversation has several", () => {
    const other: ArtifactVersion = { id: "c3", path: "out/b.html", title: "B", version: 1 };
    panel({ versions: [v1, v2, other] });
    const select = screen.getByTestId("chat-select-artifact-version") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual([
      "Plan · v1",
      "Plan · v2",
      "B · v1",
    ]);
  });

  it("shows loading and errors instead of the frame", () => {
    const { rerender } = panel({ page: { status: "loading" } });
    expect(screen.queryByTestId("chat-frame-artifact")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Loading the artifact…");
    rerender(
      <ArtifactPanel
        onClose={vi.fn()}
        onSelect={vi.fn()}
        page={{ status: "error", error: "Couldn't load the artifact (404)" }}
        selected={v2}
        versions={[v1, v2]}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Couldn't load the artifact (404)");
  });

  it("closes", () => {
    const onClose = vi.fn();
    panel({ onClose });
    fireEvent.click(screen.getByTestId("chat-btn-artifact-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
