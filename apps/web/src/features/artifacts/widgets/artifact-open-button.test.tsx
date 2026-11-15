import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtifactOpenButton } from "./artifact-open-button";

afterEach(cleanup);

describe("ArtifactOpenButton", () => {
  it("reopens the preview", () => {
    const onOpen = vi.fn();
    render(<ArtifactOpenButton onOpen={onOpen} title="Plan" />);
    const button = screen.getByTestId("chat-btn-artifact-open");
    expect(button.getAttribute("aria-label")).toBe("Show Plan");
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalled();
  });
});
