import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionHistory } from "./session-history";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const entry = (sessionId: string, title: string, expired = false) => ({
  sessionId,
  title,
  createdAt: "2026-11-15T09:00:00.000Z",
  updatedAt: "2026-11-15T09:00:00.000Z",
  expired,
});

function serve(...entries: ReturnType<typeof entry>[]) {
  let sessions = [...entries];
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const id = new URL(url, "http://localhost").searchParams.get("id");
    if (init?.method === "DELETE") {
      sessions = sessions.filter((s) => s.sessionId !== id);
      return Response.json({ ok: true });
    }
    if (init?.method === "PATCH") {
      const { title } = JSON.parse(String(init.body)) as { title: string };
      if (!title.trim()) return Response.json({ ok: false, error: "empty" }, { status: 400 });
      return Response.json({ ok: true, title: title.trim() });
    }
    return Response.json({ sessions });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const show = (activeSessionId?: string, onActiveDeleted = vi.fn()) => {
  render(
    <SessionHistory
      activeSessionId={activeSessionId}
      agent="companion"
      onActiveDeleted={onActiveDeleted}
      refreshKey="k"
    />,
  );
  return onActiveDeleted;
};

describe("SessionHistory", () => {
  it("lists the sessions, highlights the open one, and badges expired ones", async () => {
    serve(entry("s1", "Recent"), entry("s2", "Old", true));
    show("s1");
    await waitFor(() => expect(screen.getByTestId("chat-row-session-1")).toBeTruthy());
    expect(screen.getByTestId("chat-link-session-0").getAttribute("aria-current")).toBe("page");
    expect(screen.queryByTestId("chat-badge-session-expired-0")).toBeNull();
    expect(screen.getByTestId("chat-badge-session-expired-1")).toBeTruthy();
  });

  it("renames a session, and keeps the field open when the rename is refused", async () => {
    serve(entry("s1", "Recent"));
    show();
    fireEvent.click(await screen.findByTestId("chat-btn-session-rename-0"));
    const input = screen.getByTestId("chat-input-session-title");
    fireEvent.change(input, { target: { value: " " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-sessions-error").textContent).toBe("empty"),
    );
    expect(screen.getByTestId("chat-input-session-title")).toBeTruthy();
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(screen.getByTestId("chat-text-session-title-0").textContent).toBe("Renamed"),
    );
  });

  it("deletes after confirming, leaving the open chat alone for another session", async () => {
    serve(entry("s1", "One"), entry("s2", "Two"));
    const onActiveDeleted = show("s1");
    fireEvent.click(await screen.findByTestId("chat-btn-session-delete-1"));
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-confirm"));
    await waitFor(() => expect(screen.queryByTestId("chat-row-session-1")).toBeNull());
    expect(onActiveDeleted).not.toHaveBeenCalled();
  });

  it("leaves the chat when the open session is deleted", async () => {
    serve(entry("s1", "One"));
    const onActiveDeleted = show("s1");
    fireEvent.click(await screen.findByTestId("chat-btn-session-delete-0"));
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-confirm"));
    await waitFor(() => expect(onActiveDeleted).toHaveBeenCalled());
  });

  it("keeps the row when a delete fails", async () => {
    const fetch = serve(entry("s1", "One"));
    show();
    fireEvent.click(await screen.findByTestId("chat-btn-session-delete-0"));
    fetch.mockResolvedValueOnce(new Response("down", { status: 503 }));
    fireEvent.click(screen.getByTestId("chat-btn-session-delete-confirm"));
    await waitFor(() => expect(screen.getByTestId("chat-text-sessions-error")).toBeTruthy());
    expect(screen.getByTestId("chat-btn-session-delete-confirm")).toBeTruthy();
  });

  it("opens and closes on a toggle", async () => {
    serve();
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
    show();
    fireEvent.click(screen.getByTestId("chat-btn-sessions-open"));
    expect(screen.getByTestId("chat-panel-sessions").className).not.toContain("hidden");
  });
});
