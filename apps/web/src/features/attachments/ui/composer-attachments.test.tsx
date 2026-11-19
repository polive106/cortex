import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES } from "../api";
import { ComposerAttachments } from "./composer-attachments";

afterEach(cleanup);

const file = (name: string, type: string, size = 10) => {
  const made = new File(["x"], name, { type });
  Object.defineProperty(made, "size", { value: size });
  return made;
};

function Composer({
  error,
  onDismissError = () => {},
  onError = () => {},
  disabled = false,
}: {
  error?: string;
  onDismissError?: () => void;
  onError?: () => void;
  disabled?: boolean;
}) {
  return (
    <PromptInput
      accept={ATTACHMENT_ACCEPT}
      maxFileSize={ATTACHMENT_MAX_BYTES}
      maxFiles={1}
      onError={onError}
      onSubmit={() => {}}
    >
      <ComposerAttachments disabled={disabled} error={error} onDismissError={onDismissError} />
    </PromptInput>
  );
}

const pick = (...files: File[]) =>
  fireEvent.change(screen.getByTestId("chat-input-attachment"), { target: { files } });

describe("ComposerAttachments", () => {
  it("picks a file through the attach button and shows it until removed", async () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:x");
    globalThis.URL.revokeObjectURL = vi.fn();
    const onDismissError = vi.fn();
    render(<Composer onDismissError={onDismissError} />);

    const input = screen.getByTestId("chat-input-attachment");
    expect(input.getAttribute("accept")).toBe(ATTACHMENT_ACCEPT);
    expect(screen.getByTestId("chat-btn-attach").getAttribute("aria-label")).toBe("Attach a file");

    pick(file("runbook.pdf", "application/pdf"));
    await waitFor(() => screen.getByTestId("chat-chip-attachment-0"));
    expect(onDismissError).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("chat-btn-remove-attachment-0"));
    await waitFor(() => expect(screen.queryByTestId("chat-chip-attachment-0")).toBeNull());
  });

  it("refuses a file the composer doesn't accept", () => {
    const onError = vi.fn();
    render(<Composer onError={onError} />);
    pick(file("table.csv", "text/csv"));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "accept" }));
    pick(file("big.pdf", "application/pdf", ATTACHMENT_MAX_BYTES + 1));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "max_file_size" }));
    expect(screen.queryByTestId("chat-chip-attachment-0")).toBeNull();
  });

  it("shows why a file was refused, and dismisses it", () => {
    const onDismissError = vi.fn();
    render(<Composer error="Files must be 3 MB or less." onDismissError={onDismissError} />);
    const alert = screen.getByTestId("chat-text-attachment-error");
    expect(alert.getAttribute("role")).toBe("alert");
    expect(alert.textContent).toContain("Files must be 3 MB or less.");
    fireEvent.click(screen.getByTestId("chat-btn-dismiss-attachment-error"));
    expect(onDismissError).toHaveBeenCalled();
  });

  it("can't attach while disabled", () => {
    render(<Composer disabled />);
    expect(screen.getByTestId("chat-input-attachment").hasAttribute("disabled")).toBe(true);
    expect(screen.getByTestId("chat-btn-attach").getAttribute("aria-disabled")).toBe("true");
  });
});
