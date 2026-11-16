import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { pinnedLookup, pinnedTransport } from "./pinned-transport";

// A real local server, no msw: "pinned.invalid" can't resolve, so every answer here proves the
// socket used the pinned address instead of DNS.
let server: Server;
let port: number;
const hits: string[] = [];
beforeAll(async () => {
  server = createServer((req, res) => {
    hits.push(`${req.headers.host} ${req.url}`);
    if (req.url === "/moved") {
      res.writeHead(302, { location: "/elsewhere" }).end("ignored");
    } else if (req.url === "/empty") {
      res.writeHead(204).end();
    } else if (req.url === "/slow") {
      setTimeout(() => res.end("late"), 5_000).unref();
    } else {
      res.setHeader("set-cookie", ["a=1", "b=2"]);
      res.writeHead(200, { "content-type": "text/plain" }).end(`accept: ${req.headers.accept}`);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});
afterAll(() => {
  server.closeAllConnections();
  server.close();
});

const url = (path: string, scheme = "http") => `${scheme}://pinned.invalid:${port}${path}`;
const never = () => new AbortController().signal;

describe("pinnedTransport", () => {
  it("connects to the pinned address, keeping the URL's host name", async () => {
    const response = await pinnedTransport(url("/page"), ["127.0.0.1"], never());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("set-cookie")).toBe("a=1, b=2");
    await expect(response.text()).resolves.toContain("accept: text/html");
    expect(hits).toContain(`pinned.invalid:${port} /page`);
  });

  it("returns redirects instead of following them, and bodiless statuses", async () => {
    const moved = await pinnedTransport(url("/moved"), ["127.0.0.1"], never());
    expect(moved.status).toBe(302);
    expect(moved.headers.get("location")).toBe("/elsewhere");
    const empty = await pinnedTransport(url("/empty"), ["127.0.0.1"], never());
    expect(empty.status).toBe(204);
    expect(empty.body).toBeNull();
  });

  it("aborts with the signal", async () => {
    const controller = new AbortController();
    const pending = pinnedTransport(url("/slow"), ["127.0.0.1"], controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow();
  });

  it("speaks TLS for https URLs", async () => {
    // The local server is plain HTTP, so the TLS handshake fails: proof https was used.
    await expect(pinnedTransport(url("/page", "https"), ["127.0.0.1"], never())).rejects.toThrow();
  });
});

describe("pinnedLookup", () => {
  it("answers with every pinned address when asked for all", () => {
    const callback = vi.fn();
    pinnedLookup(["93.184.216.34", "2606:4700::1111"])("evil.test", { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [
      { address: "93.184.216.34", family: 4 },
      { address: "2606:4700::1111", family: 6 },
    ]);
  });

  it("answers with the first pinned address otherwise", () => {
    const callback = vi.fn();
    pinnedLookup(["2606:4700::1111", "93.184.216.34"])("evil.test", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "2606:4700::1111", 6);
  });
});
