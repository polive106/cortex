"use client";

import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { InputGroupAddon } from "@/components/ui/input-group";
import { ATTACHMENT_ACCEPT, ATTACHMENT_HINT } from "../api";
import { AttachButton } from "../widgets/attach-button";
import { AttachmentChips } from "../widgets/attachment-chips";
import { AttachmentError } from "../widgets/attachment-error";

/**
 * The composer's attachments (E3-US10): pending files and any refusal above the text, the attach
 * button below it. Goes inside a `PromptInput`, whose `accept`, `maxFileSize`, and `onError`
 * validate every file, picked, pasted, or dropped.
 */
export function ComposerAttachments({
  disabled,
  error,
  onDismissError,
}: {
  readonly disabled: boolean;
  readonly error?: string;
  readonly onDismissError: () => void;
}) {
  const attachments = usePromptInputAttachments();
  return (
    <>
      {error !== undefined || attachments.files.length > 0 ? (
        <InputGroupAddon align="block-start" className="flex-col items-start">
          {error && <AttachmentError message={error} onDismiss={onDismissError} />}
          {attachments.files.length > 0 && (
            <AttachmentChips files={attachments.files} onRemove={attachments.remove} />
          )}
        </InputGroupAddon>
      ) : null}
      <InputGroupAddon align="block-end" className="py-2.5 pl-2.5">
        <AttachButton
          accept={ATTACHMENT_ACCEPT}
          disabled={disabled}
          hint={ATTACHMENT_HINT}
          onFiles={(files) => {
            onDismissError();
            attachments.add(files);
          }}
        />
      </InputGroupAddon>
    </>
  );
}
