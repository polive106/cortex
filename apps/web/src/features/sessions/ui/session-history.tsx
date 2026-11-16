"use client";

import { useSessionEdits } from "../hooks/use-session-edits";
import { useSessions } from "../hooks/use-sessions";
import { useSidebarOpen } from "../hooks/use-sidebar-open";
import { SessionRow } from "../widgets/session-row";
import { SessionSidebar } from "../widgets/session-sidebar";

export interface SessionHistoryProps {
  /** The agent whose `/sessions` route holds the list. */
  readonly agent: string;
  /** The session open in the chat, highlighted in the list. */
  readonly activeSessionId: string | undefined;
  /** Reloads the list whenever it changes; undefined holds the list while a turn runs. */
  readonly refreshKey: string | undefined;
  /** Where to go after deleting the open session. */
  readonly onActiveDeleted: () => void;
}

/** The signed-in user's earlier sessions, to reopen, rename, or delete (E6-US03). */
export function SessionHistory({
  agent,
  activeSessionId,
  refreshKey,
  onActiveDeleted,
}: SessionHistoryProps) {
  const { status, sessions, error, rename, remove } = useSessions(agent, refreshKey);
  const edits = useSessionEdits();
  const sidebar = useSidebarOpen();

  return (
    <SessionSidebar
      empty={sessions.length === 0}
      error={error}
      onToggle={sidebar.toggle}
      open={sidebar.open}
      status={status}
    >
      {sessions.map((entry, index) => (
        <SessionRow
          active={entry.sessionId === activeSessionId}
          confirming={edits.confirming === entry.sessionId}
          entry={entry}
          index={index}
          key={entry.sessionId}
          onCancel={edits.cancel}
          onDelete={async () => {
            if (!(await remove(entry.sessionId))) return;
            edits.cancel();
            if (entry.sessionId === activeSessionId) onActiveDeleted();
          }}
          onRename={async (title) => {
            if (await rename(entry.sessionId, title)) edits.cancel();
          }}
          onStartDelete={() => edits.startDelete(entry.sessionId)}
          onStartRename={() => edits.startRename(entry.sessionId)}
          renaming={edits.renaming === entry.sessionId}
        />
      ))}
    </SessionSidebar>
  );
}
