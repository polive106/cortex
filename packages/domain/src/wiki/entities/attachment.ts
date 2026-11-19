import { collapseWhitespace } from "./text";

/**
 * What the web chat accepts as an attachment (E3-US10): PDFs and the image formats every model
 * provider reads natively. The brain keeps a text capture of a saved file, never the file
 * (ADR-0004), so nothing else is worth uploading.
 */
export const ATTACHMENT_MEDIA_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

/** 3 MB: inlined as base64, a file this size still fits Vercel's 4.5 MB request body limit. */
export const ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;

/** One file per message, for the same limit: two 3 MB files wouldn't fit. */
export const ATTACHMENT_MAX_FILES = 1;

/** The `origin` of a source captured from an uploaded file: `upload:<file name>`. */
export function uploadOrigin(filename: string): string {
  const name = collapseWhitespace(filename.replace(/^.*[/\\]/, ""));
  return `upload:${name || "file"}`;
}
