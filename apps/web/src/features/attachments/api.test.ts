import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_HINT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  attachmentErrorMessage,
} from "./api";

describe("attachment limits", () => {
  it("accepts the domain's media types, 3 MB, one file per message", () => {
    expect(ATTACHMENT_ACCEPT).toBe("application/pdf,image/png,image/jpeg,image/gif,image/webp");
    expect(ATTACHMENT_MAX_BYTES).toBe(3 * 1024 * 1024);
    expect(ATTACHMENT_MAX_FILES).toBe(1);
    expect(ATTACHMENT_HINT).toBe("Attach a PDF, PNG, JPEG, GIF, or WebP file (3 MB max)");
  });

  it.each([
    ["accept", "Only PDF, PNG, JPEG, GIF, or WebP files can be attached."],
    ["max_file_size", "Files must be 3 MB or less. Split the PDF, or paste its text."],
    ["max_files", "Attach one file per message."],
  ] as const)("explains %s", (code, message) => {
    expect(attachmentErrorMessage(code)).toBe(message);
  });
});
