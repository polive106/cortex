import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionRow, type SessionRowProps } from "./session-row";

afterEach(cleanup);

const entry = {
  sessionId: "s/1",
  title: "Plan the trip",
  createdAt: "2026-11-15T09:00:00.000Z",
  updatedAt: "2026-11-15T09:00:00.000Z",
  expired: false,
};

function renderRow(overrides: Partial<SessionRowProps> = {}) {
  const props: SessionRowProps = {
    entry,
    index: 0,
    active: false,
    renaming: false,
    confirming: false,
    onStartRename: vi.fn(),
    onStartDelete: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(
    <ul>
      <SessionRow {...props} />
    </ul>,
  );
  return props;
}

describe("SessionRow", () => {
  it("links to the session, and marks the open one", () => {
    renderRow({ active: true });
    const link = screen.getByTestId("chat-link-session-0");
    expect(link.getAttribute("href")).toBe("/s/s%2F1");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("chat-text-session-title-0").textContent).toBe("Plan the trip");
    expect(screen.queryByTestId("chat-badge-session-expired-0")).toBeNull();
  });

  it("badges an expired session", () => {
    renderRow({ entry: { ...entry, expired: true } });
    expect(screen.getByTestId("chat-badge-session-expired-0").textContent).toBe("Expired");
    expect(screen.getByTestId("chat-link-session-0").getAttribute("aria-current")).toBeNull();
  });

  it("starts a rename or a delete", () => {
    const props = renderRow();
    fireEvent.click(screen.getByTestId("chat-btn-session-rename-0"));
    expect(props.onStartRename).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-0"));
    expect(props.onStartDelete).toHaveBeenCalled();
  });

  it("saves a rename on Enter and cancels on Escape or blur", () => {
    const props = renderRow({ renaming: true });
    const input = screen.getByTestId("chat-input-session-title") as HTMLInputElement;
    expect(input.value).toBe("Plan the trip");
    fireEvent.change(input, { target: { value: "Trip" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onRename).toHaveBeenCalledWith("Trip");
    fireEvent.keyDown(input, { key: "a" });
    expect(props.onCancel).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });

  it("confirms or cancels a delete", () => {
    const props = renderRow({ confirming: true });
    expect(screen.getByTestId("chat-row-session-0").textContent).toContain(
      "Delete “Plan the trip”?",
    );
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-confirm"));
    expect(props.onDelete).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-cancel"));
    expect(props.onCancel).toHaveBeenCalled();
  });
});
