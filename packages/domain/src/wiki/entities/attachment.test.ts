import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  ATTACHMENT_MEDIA_TYPES,
  uploadOrigin,
} from "./attachment";

describe("attachment limits", () => {
  it("allows one PDF or image every provider reads natively, up to 3 MB", () => {
    expect(ATTACHMENT_MEDIA_TYPES).toEqual([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ]);
    expect(ATTACHMENT_MAX_BYTES).toBe(3 * 1024 * 1024);
    expect(ATTACHMENT_MAX_FILES).toBe(1);
  });
});

describe("uploadOrigin", () => {
  it("names the uploaded file", () => {
    expect(uploadOrigin("deploy-runbook.pdf")).toBe("upload:deploy-runbook.pdf");
  });

  it("keeps only the file name, on one line", () => {
    expect(uploadOrigin("/workspace/.eve/attachments/ab12/My\nScan.png")).toBe(
      "upload:My Scan.png",
    );
    expect(uploadOrigin("C:\\Users\\me\\notes.pdf")).toBe("upload:notes.pdf");
  });

  it("falls back to a generic name", () => {
    expect(uploadOrigin("  ")).toBe("upload:file");
  });
});
