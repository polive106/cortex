import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionSidebar, type SessionSidebarProps } from "./session-sidebar";

afterEach(cleanup);

function renderSidebar(overrides: Partial<SessionSidebarProps> = {}) {
  const props: SessionSidebarProps = {
    open: undefined,
    status: "ready",
    error: undefined,
    empty: false,
    onToggle: vi.fn(),
    children: <li>row</li>,
    ...overrides,
  };
  render(<SessionSidebar {...props} />);
  return props;
}

const panel = () => screen.getByTestId("chat-panel-sessions");

describe("SessionSidebar", () => {
  it("leaves the default to CSS: open on wide screens, a button on small ones", () => {
    renderSidebar();
    expect(panel().className).toContain("hidden md:flex");
    expect(screen.getByTestId("chat-btn-sessions-open").className).toContain("md:hidden");
    expect(screen.getByTestId("chat-list-sessions").textContent).toBe("row");
  });

  it("shows or hides the panel once toggled", () => {
    const props = renderSidebar({ open: true });
    expect(panel().className).toMatch(/(^| )flex( |$)/);
    expect(screen.queryByTestId("chat-btn-sessions-open")).toBeNull();
    fireEvent.click(screen.getByTestId("chat-btn-sessions-close"));
    fireEvent.click(screen.getByTestId("chat-btn-sessions-backdrop"));
    expect(props.onToggle).toHaveBeenCalledTimes(2);
    cleanup();
    renderSidebar({ open: false });
    expect(panel().className).toMatch(/(^| )hidden( |$)/);
    expect(screen.queryByTestId("chat-btn-sessions-backdrop")).toBeNull();
    expect(screen.getByTestId("chat-btn-sessions-open").className).not.toContain("md:hidden");
  });

  it("links to a new chat", () => {
    renderSidebar();
    expect(screen.getByTestId("chat-link-sessions-new").getAttribute("href")).toBe("/s");
  });

  it("says when it's loading or empty", () => {
    renderSidebar({ empty: true, status: "loading", children: null });
    expect(screen.getByTestId("chat-text-sessions-empty").textContent).toBe("Loading…");
    cleanup();
    renderSidebar({ empty: true, children: null });
    expect(screen.getByTestId("chat-text-sessions-empty").textContent).toBe("No sessions yet");
  });

  it("shows an error instead of the empty state", () => {
    renderSidebar({ empty: true, status: "error", error: "Couldn't load", children: null });
    expect(screen.getByTestId("chat-text-sessions-error").textContent).toBe("Couldn't load");
    expect(screen.queryByTestId("chat-text-sessions-empty")).toBeNull();
  });
});
