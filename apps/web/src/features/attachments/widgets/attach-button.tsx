import { PaperclipIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Opens the file picker. A label wrapping the file input needs no ref to open the dialog, so the
 * widget stays props only.
 */
export function AttachButton({
  accept,
  disabled,
  hint,
  onFiles,
}: {
  readonly accept: string;
  readonly disabled: boolean;
  readonly hint: string;
  readonly onFiles: (files: FileList) => void;
}) {
  return (
    <label
      aria-disabled={disabled}
      aria-label="Attach a file"
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        disabled && "pointer-events-none opacity-50",
      )}
      data-testid="chat-btn-attach"
      title={hint}
    >
      <PaperclipIcon className="size-4" />
      <input
        accept={accept}
        className="sr-only"
        data-testid="chat-input-attachment"
        disabled={disabled}
        onChange={(event) => {
          if (event.currentTarget.files) onFiles(event.currentTarget.files);
          // Reset so the same file can be picked again after removing it.
          event.currentTarget.value = "";
        }}
        type="file"
      />
    </label>
  );
}
