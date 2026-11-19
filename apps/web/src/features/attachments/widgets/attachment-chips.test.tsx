import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttachmentChips } from "./attachment-chips";

afterEach(cleanup);

const pdf = { id: "a", filename: "runbook.pdf", mediaType: "application/pdf", url: "blob:a" };
const png = { id: "b", filename: "shot.png", mediaType: "image/png", url: "blob:b" };

describe("AttachmentChips", () => {
  it("shows a thumbnail for an image and a file chip for a PDF", () => {
    render(<AttachmentChips files={[pdf, png]} onRemove={() => {}} />);
    expect(screen.getByTestId("chat-chip-attachment-0").textContent).toContain("runbook.pdf");
    expect(screen.getByTestId("chat-chip-attachment-0").querySelector("img")).toBeNull();
    const thumbnail = screen.getByTestId("chat-chip-attachment-1").querySelector("img");
    expect(thumbnail?.getAttribute("src")).toBe("blob:b");
    expect(thumbnail?.getAttribute("alt")).toBe("shot.png");
  });

  it("removes a file", () => {
    const onRemove = vi.fn();
    render(<AttachmentChips files={[pdf]} onRemove={onRemove} />);
    const remove = screen.getByTestId("chat-btn-remove-attachment-0");
    expect(remove.getAttribute("aria-label")).toBe("Remove runbook.pdf");
    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledWith("a");
  });

  it("names a file that has no name", () => {
    render(<AttachmentChips files={[{ ...pdf, filename: undefined }]} onRemove={() => {}} />);
    expect(screen.getByTestId("chat-chip-attachment-0").textContent).toContain("Attachment");
  });
});
