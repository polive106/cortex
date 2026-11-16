import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrainOpenButton } from "./brain-open-button";
import { BrainTrailPanel } from "./brain-trail-panel";

afterEach(cleanup);

describe("BrainTrailPanel", () => {
  it("shows the graph, the step count, a legend and a link to the full view", () => {
    render(
      <BrainTrailPanel hidden={false} onClose={vi.fn()} steps={3}>
        <p data-testid="graph">graph</p>
      </BrainTrailPanel>,
    );
    expect(screen.getByTestId("chat-panel-brain").textContent).toContain("read");
    expect(screen.getByTestId("graph")).toBeTruthy();
    expect(screen.getByTestId("chat-text-brain-steps").textContent).toBe(
      "3 steps this conversation",
    );
    expect(screen.getByTestId("chat-link-brain-full").getAttribute("href")).toBe("/brain");
  });

  it("says one step, and closes", () => {
    const onClose = vi.fn();
    render(
      <BrainTrailPanel hidden onClose={onClose} steps={1}>
        {null}
      </BrainTrailPanel>,
    );
    expect(screen.getByTestId("chat-text-brain-steps").textContent).toBe(
      "1 step this conversation",
    );
    expect(screen.getByTestId("chat-panel-brain").getAttribute("data-hidden")).toBe("true");
    fireEvent.click(screen.getByTestId("chat-btn-brain-close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("BrainOpenButton", () => {
  it("reopens the panel, moving aside for the artifact button", () => {
    const onOpen = vi.fn();
    render(<BrainOpenButton onOpen={onOpen} shifted={false} />);
    const button = screen.getByTestId("chat-btn-brain-open");
    expect(button.className).toContain("right-36");
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalled();
    cleanup();
    render(<BrainOpenButton onOpen={onOpen} shifted />);
    expect(screen.getByTestId("chat-btn-brain-open").className).toContain("right-[17rem]");
  });
});
