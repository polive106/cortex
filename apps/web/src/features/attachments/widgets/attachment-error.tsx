import { AlertCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Why the composer refused a file. */
export function AttachmentError({
  message,
  onDismiss,
}: {
  readonly message: string;
  readonly onDismiss: () => void;
}) {
  return (
    <p
      className="flex w-full items-center gap-2 text-destructive text-sm"
      data-testid="chat-text-attachment-error"
      role="alert"
    >
      <AlertCircleIcon className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <Button
        aria-label="Dismiss"
        data-testid="chat-btn-dismiss-attachment-error"
        onClick={onDismiss}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <XIcon className="size-3.5" />
      </Button>
    </p>
  );
}
