import { MAX_TITLE_LENGTH } from "@cortex/domain";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sessionPath } from "@/lib/session-route";
import { cn } from "@/lib/utils";
import type { SessionEntry } from "../api";

export interface SessionRowProps {
  readonly entry: SessionEntry;
  readonly index: number;
  readonly active: boolean;
  readonly renaming: boolean;
  readonly confirming: boolean;
  readonly onStartRename: () => void;
  readonly onStartDelete: () => void;
  readonly onRename: (title: string) => void;
  readonly onDelete: () => void;
  readonly onCancel: () => void;
}

/** One session in the sidebar: a link to reopen it, or its rename field, or a delete prompt. */
export function SessionRow(props: SessionRowProps) {
  const { entry, index, active, renaming, confirming } = props;
  const testId = `chat-row-session-${index}`;

  if (renaming) {
    return (
      <li className="px-2 py-1" data-testid={testId}>
        <input
          aria-label="Session title"
          // Focus moves straight into the field the person just asked to edit.
          autoFocus
          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          data-testid="chat-input-session-title"
          defaultValue={entry.title}
          maxLength={MAX_TITLE_LENGTH}
          onBlur={props.onCancel}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              props.onRename(event.currentTarget.value);
            } else if (event.key === "Escape") {
              props.onCancel();
            }
          }}
        />
      </li>
    );
  }

  if (confirming) {
    return (
      <li
        className="flex flex-col gap-2 rounded-md bg-muted px-3 py-2 text-sm"
        data-testid={testId}
      >
        <p className="break-words">Delete “{entry.title}”? This can’t be undone.</p>
        <div className="flex gap-2">
          <Button
            data-testid="chat-btn-session-delete-confirm"
            onClick={props.onDelete}
            size="sm"
            type="button"
            variant="destructive"
          >
            Delete
          </Button>
          <Button
            data-testid="chat-btn-session-delete-cancel"
            onClick={props.onCancel}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group relative flex items-center rounded-md text-sm hover:bg-muted",
        active && "bg-muted font-medium",
      )}
      data-testid={testId}
    >
      <a
        aria-current={active ? "page" : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-16 pl-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        data-testid={`chat-link-session-${index}`}
        href={sessionPath(entry.sessionId)}
        title={entry.title}
      >
        <span className="truncate" data-testid={`chat-text-session-title-${index}`}>
          {entry.title}
        </span>
        {entry.expired ? (
          <span
            className="shrink-0 rounded border px-1 text-[10px] text-muted-foreground uppercase"
            data-testid={`chat-badge-session-expired-${index}`}
            title="Idle for over 30 days: the conversation may no longer be available"
          >
            Expired
          </span>
        ) : null}
      </a>
      {/* Always shown on touch screens; on hover or focus with a pointer. */}
      <div className="absolute right-1 flex gap-0.5 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <Button
          aria-label={`Rename ${entry.title}`}
          data-testid={`chat-btn-session-rename-${index}`}
          onClick={props.onStartRename}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <PencilIcon />
        </Button>
        <Button
          aria-label={`Delete ${entry.title}`}
          data-testid={`chat-btn-session-delete-${index}`}
          onClick={props.onStartDelete}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}
