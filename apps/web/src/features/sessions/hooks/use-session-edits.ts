import { useState } from "react";

type Edit = { readonly kind: "rename" | "delete"; readonly sessionId: string } | undefined;

export interface SessionEditsState {
  /** The session whose title is being edited. */
  readonly renaming: string | undefined;
  /** The session waiting for its delete to be confirmed. */
  readonly confirming: string | undefined;
  readonly startRename: (sessionId: string) => void;
  readonly startDelete: (sessionId: string) => void;
  readonly cancel: () => void;
}

/** Which sidebar row is being renamed or deleted: one at a time. */
export function useSessionEdits(): SessionEditsState {
  const [edit, setEdit] = useState<Edit>();
  return {
    renaming: edit?.kind === "rename" ? edit.sessionId : undefined,
    confirming: edit?.kind === "delete" ? edit.sessionId : undefined,
    startRename: (sessionId) => setEdit({ kind: "rename", sessionId }),
    startDelete: (sessionId) => setEdit({ kind: "delete", sessionId }),
    cancel: () => setEdit(undefined),
  };
}
