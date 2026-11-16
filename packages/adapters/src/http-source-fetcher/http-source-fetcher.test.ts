import { BlockedAddressError, SourceFetchError } from "@cortex/domain";
import { delay, HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { describeSourceFetcherContract } from "../contracts/source-fetcher-contract";
import { HttpSourceFetcher, type HttpSourceFetcherOptions } from "./http-source-fetcher";
import type { Transport } from "./pinned-transport";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** Public addresses for every host unless a test says otherwise; DNS is never real here. */
const PUBLIC = async () => ["93.184.216.34"];
/** Global fetch, which msw intercepts; pinned-transport.test.ts covers the real transport. */
const viaFetch: Transport = (url, _addresses, signal) => fetch(url, { redirect: "manual", signal });
const fetcher = (options: HttpSourceFetcherOptions = {}) =>
  new HttpSourceFetcher({ resolve: PUBLIC, transport: viaFetch, ...options });

const html = (body: string, headers: Record<string, string> = {}) =>
  new HttpResponse(body, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });

describeSourceFetcherContract("HttpSourceFetcher", async (pages) => {
  server.use(
    http.get("https://contract.test/*", ({ request }) => {
      const page = pages[request.url];
      if (!page) return new HttpResponse(null, { status: 404 });
      return html(`<title>${page.title}</title><body><p>${page.text}</p></body>`);
    }),
  );
  return fetcher();
});

describe("HttpSourceFetcher", () => {
  it("extracts the title and readable text from HTML", async () => {
    server.use(
      http.get("https://example.com/post", () =>
        html("<title>Post</title><article><h1>Post</h1><p>Hello.</p></article>"),
      ),
    );
    await expect(fetcher().fetch("https://example.com/post")).resolves.toEqual({
      title: "Post",
      text: "# Post\n\nHello.",
    });
  });

  it("keeps plain text and Markdown as they are, titled by the first heading or the path", async () => {
    server.use(
      http.get("https://example.com/notes.md", () =>
        HttpResponse.text("Intro\n\n# Notes\n\nBody", {
          headers: { "content-type": "text/markdown" },
        }),
      ),
      http.get("https://example.com/files/readme.txt", () => HttpResponse.text("  Just text.  ")),
      http.get("https://example.com/", () => HttpResponse.text("Root")),
    );
    await expect(fetcher().fetch("https://example.com/notes.md")).resolves.toEqual({
      title: "Notes",
      text: "Intro\n\n# Notes\n\nBody",
    });
    await expect(fetcher().fetch("https://example.com/files/readme.txt")).resolves.toEqual({
      title: "readme.txt",
      text: "Just text.",
    });
    await expect(fetcher().fetch("https://example.com/")).resolves.toMatchObject({
      title: "example.com",
    });
  });

  it("decodes the declared charset", async () => {
    const latin1 = new Uint8Array([0x63, 0x61, 0x66, 0xe9]); // "café" in ISO-8859-1
    server.use(
      http.get("https://example.com/latin", () =>
        HttpResponse.arrayBuffer(latin1.buffer, {
          headers: { "content-type": "text/plain; charset=iso-8859-1" },
        }),
      ),
      http.get("https://example.com/odd", () =>
        HttpResponse.text("plain", { headers: { "content-type": "text/plain; charset=nope" } }),
      ),
    );
    await expect(fetcher().fetch("https://example.com/latin")).resolves.toMatchObject({
      text: "café",
    });
    await expect(fetcher().fetch("https://example.com/odd")).resolves.toMatchObject({
      text: "plain",
    });
  });

  it("refuses a host that resolves to a private address, without requesting it", async () => {
    const hit = vi.fn();
    server.use(http.get("https://rebind.example.com/", hit));
    const fetch = fetcher({ resolve: async () => ["93.184.216.34", "10.0.0.5"] }).fetch(
      "https://rebind.example.com/",
    );
    await expect(fetch).rejects.toThrow(BlockedAddressError);
    await expect(fetch).rejects.toThrow("rebind.example.com is a private or local address");
    expect(hit).not.toHaveBeenCalled();
  });

  it("refuses a literal private address before resolving anything", async () => {
    const resolve = vi.fn(PUBLIC);
    await expect(fetcher({ resolve }).fetch("http://169.254.169.254/")).rejects.toThrow(
      BlockedAddressError,
    );
    expect(resolve).not.toHaveBeenCalled();
  });

  it("follows redirects, checking every hop", async () => {
    server.use(
      http.get(
        "https://example.com/old",
        () => new HttpResponse(null, { status: 301, headers: { location: "/new" } }),
      ),
      http.get("https://example.com/new", () => HttpResponse.text("Moved here")),
      http.get(
        "https://example.com/sneaky",
        () =>
          new HttpResponse(null, {
            status: 302,
            headers: { location: "http://169.254.169.254/latest/meta-data/" },
          }),
      ),
    );
    await expect(fetcher().fetch("https://example.com/old")).resolves.toMatchObject({
      text: "Moved here",
    });
    await expect(fetcher().fetch("https://example.com/sneaky")).rejects.toThrow(
      BlockedAddressError,
    );
  });

  it("checks the resolved addresses of every redirect target", async () => {
    server.use(
      http.get(
        "https://example.com/hop",
        () =>
          new HttpResponse(null, {
            status: 307,
            headers: { location: "https://internal.example.net/" },
          }),
      ),
    );
    const resolve = async (host: string) =>
      host === "internal.example.net" ? ["192.168.1.10"] : ["93.184.216.34"];
    await expect(fetcher({ resolve }).fetch("https://example.com/hop")).rejects.toThrow(
      "internal.example.net is a private or local address",
    );
  });

  it("stops after too many redirects, or a redirect without a location", async () => {
    server.use(
      http.get(
        "https://example.com/loop",
        () => new HttpResponse(null, { status: 302, headers: { location: "/loop" } }),
      ),
      http.get("https://example.com/nowhere", () => new HttpResponse(null, { status: 302 })),
    );
    await expect(fetcher({ maxRedirects: 2 }).fetch("https://example.com/loop")).rejects.toThrow(
      "more than 2 redirects",
    );
    await expect(fetcher().fetch("https://example.com/nowhere")).rejects.toThrow("HTTP 302");
  });

  it("reports HTTP errors and unsupported content as fetch errors", async () => {
    server.use(
      http.get("https://example.com/missing", () => new HttpResponse(null, { status: 404 })),
      http.get("https://example.com/image.png", () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(4), { headers: { "content-type": "image/png" } }),
      ),
      http.get(
        "https://example.com/untyped",
        () => new HttpResponse(new Uint8Array([1, 2]), { headers: {} }),
      ),
    );
    await expect(fetcher().fetch("https://example.com/missing")).rejects.toThrow(
      new SourceFetchError("https://example.com/missing", "HTTP 404"),
    );
    await expect(fetcher().fetch("https://example.com/image.png")).rejects.toThrow(
      "image/png isn't a web page or text",
    );
    await expect(fetcher().fetch("https://example.com/untyped")).rejects.toThrow(
      "it has no content type",
    );
  });

  it("refuses bodies over the size cap, declared or streamed", async () => {
    server.use(
      http.get("https://example.com/declared", () =>
        HttpResponse.text("x", { headers: { "content-length": "5000" } }),
      ),
      // A stream has no declared length, so the cap applies while reading.
      http.get(
        "https://example.com/streamed",
        () =>
          new HttpResponse(
            new ReadableStream({
              start(controller) {
                for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(400).fill(121));
                controller.close();
              },
            }),
            { headers: { "content-type": "text/plain" } },
          ),
      ),
    );
    const small = fetcher({ maxBytes: 1000 });
    await expect(small.fetch("https://example.com/declared")).rejects.toThrow(
      "it's larger than 1 KB",
    );
    await expect(small.fetch("https://example.com/streamed")).rejects.toThrow(
      "it's larger than 1 KB",
    );
  });

  it("truncates long text and says so", async () => {
    server.use(http.get("https://example.com/long", () => HttpResponse.text("z".repeat(500))));
    const { text } = await fetcher({ maxChars: 100 }).fetch("https://example.com/long");
    expect(text).toBe(`${"z".repeat(100)}\n\n[Truncated: the page is longer than 100 characters.]`);
  });

  it("times out", async () => {
    server.use(
      http.get("https://example.com/slow", async () => {
        await delay("infinite");
        return HttpResponse.text("never");
      }),
    );
    await expect(fetcher({ timeoutMs: 50 }).fetch("https://example.com/slow")).rejects.toThrow(
      "it took longer than 0.05s",
    );
  });

  it("turns network and DNS failures into fetch errors", async () => {
    server.use(http.get("https://down.example.com/", () => HttpResponse.error()));
    await expect(fetcher().fetch("https://down.example.com/")).rejects.toThrow(
      "the request failed",
    );
    const unknown = fetcher({
      resolve: async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      },
    });
    await expect(unknown.fetch("https://nope.example.com/")).rejects.toThrow(
      "nope.example.com couldn't be resolved",
    );
    await expect(
      fetcher({ resolve: async () => [] }).fetch("https://empty.example.com/"),
    ).rejects.toThrow("empty.example.com couldn't be resolved");
  });

  it("hands the transport only the addresses it checked", async () => {
    const transport = vi.fn(viaFetch);
    server.use(http.get("https://example.com/pinned", () => HttpResponse.text("ok")));
    await fetcher({ transport }).fetch("https://example.com/pinned");
    expect(transport).toHaveBeenCalledWith(
      "https://example.com/pinned",
      ["93.184.216.34"],
      expect.any(AbortSignal),
    );
  });

  it("resolves with the system DNS by default", async () => {
    // An IPv4 literal resolves to itself, so this never needs a real DNS server.
    server.use(http.get("https://93.184.216.34/", () => HttpResponse.text("by ip")));
    const byIp = new HttpSourceFetcher({ transport: viaFetch });
    await expect(byIp.fetch("https://93.184.216.34/")).resolves.toMatchObject({ text: "by ip" });
  });
});
