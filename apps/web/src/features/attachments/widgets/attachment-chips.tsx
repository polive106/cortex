import { FileIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingAttachment } from "../api";

/** The files waiting to be sent: a thumbnail for an image, a chip for a PDF. */
export function AttachmentChips({
  files,
  onRemove,
}: {
  readonly files: readonly PendingAttachment[];
  readonly onRemove: (id: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((file, index) => {
        const label = file.filename ?? "Attachment";
        return (
          <li
            className="flex max-w-60 items-center gap-2 rounded-md border bg-background/60 py-1 pr-1 pl-1.5 text-foreground text-sm"
            data-testid={`chat-chip-attachment-${index}`}
            key={file.id}
          >
            {file.mediaType.startsWith("image/") ? (
              <img alt={label} className="size-7 shrink-0 rounded-sm object-cover" src={file.url} />
            ) : (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                <FileIcon className="size-3.5" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <Button
              aria-label={`Remove ${label}`}
              data-testid={`chat-btn-remove-attachment-${index}`}
              onClick={() => onRemove(file.id)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <XIcon className="size-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
