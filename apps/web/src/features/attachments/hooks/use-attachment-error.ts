import { useCallback, useState } from "react";
import { type AttachmentErrorCode, attachmentErrorMessage } from "../api";

/** Why the last file was refused, for the composer to show until it's dismissed. */
export function useAttachmentError() {
  const [message, setMessage] = useState<string>();
  const report = useCallback(
    ({ code }: { readonly code: AttachmentErrorCode; readonly message?: string }) =>
      setMessage(attachmentErrorMessage(code)),
    [],
  );
  const dismiss = useCallback(() => setMessage(undefined), []);
  return { message, report, dismiss };
}
