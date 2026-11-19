import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_FILES, ATTACHMENT_MEDIA_TYPES } from "@cortex/domain";

export { ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_FILES };

/** The composer's `accept`: the domain's media types, which the channel enforces too (E3-US10). */
export const ATTACHMENT_ACCEPT = ATTACHMENT_MEDIA_TYPES.join(",");

const LABELS: Record<(typeof ATTACHMENT_MEDIA_TYPES)[number], string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/gif": "GIF",
  "image/webp": "WebP",
};

const TYPES = ATTACHMENT_MEDIA_TYPES.map((type) => LABELS[type]);
const TYPE_LIST = `${TYPES.slice(0, -1).join(", ")}, or ${TYPES.at(-1)}`;
const SIZE = `${ATTACHMENT_MAX_BYTES / 1024 / 1024} MB`;

/** The attach button's hint: what it takes, from the domain's limits. */
export const ATTACHMENT_HINT = `Attach a ${TYPE_LIST} file (${SIZE} max)`;

/** Why the composer refused a file, as `PromptInput`'s `onError` reports it. */
export type AttachmentErrorCode = "accept" | "max_file_size" | "max_files";

const MESSAGES: Record<AttachmentErrorCode, string> = {
  accept: `Only ${TYPE_LIST} files can be attached.`,
  max_file_size: `Files must be ${SIZE} or less. Split the PDF, or paste its text.`,
  max_files: "Attach one file per message.",
};

export const attachmentErrorMessage = (code: AttachmentErrorCode): string => MESSAGES[code];

/** A file waiting in the composer. */
export interface PendingAttachment {
  readonly id: string;
  readonly filename?: string;
  readonly mediaType: string;
  readonly url: string;
}
