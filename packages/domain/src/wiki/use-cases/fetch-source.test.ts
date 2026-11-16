import { describe, expect, it, vi } from "vitest";
import { BlockedAddressError, SourceFetchError } from "../errors";
import type { SourceFetcher } from "../ports/source-fetcher";
import { FetchSource } from "./fetch-source";

const fetcher = (): SourceFetcher & { fetch: ReturnType<typeof vi.fn> } => ({
  fetch: vi.fn(async () => ({ title: "Post", text: "Hello." })),
});

describe("FetchSource", () => {
  it("fetches the normalized URL and returns it with the title and text", async () => {
    const port = fetcher();
    await expect(new FetchSource(port).execute(" https://Example.com/post#top ")).resolves.toEqual({
      url: "https://example.com/post",
      title: "Post",
      text: "Hello.",
    });
    expect(port.fetch).toHaveBeenCalledWith("https://example.com/post");
  });

  it("refuses a private address without calling the fetcher", async () => {
    const port = fetcher();
    await expect(new FetchSource(port).execute("http://169.254.169.254/")).rejects.toThrow(
      BlockedAddressError,
    );
    expect(port.fetch).not.toHaveBeenCalled();
  });

  it("passes fetch errors through", async () => {
    const port = fetcher();
    port.fetch.mockRejectedValueOnce(new SourceFetchError("https://example.com/", "HTTP 404"));
    await expect(new FetchSource(port).execute("https://example.com/")).rejects.toThrow("HTTP 404");
  });
});
