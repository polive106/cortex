import {
  BlockedAddressError,
  type FetchedSource,
  isBlockedAddress,
  SourceFetchError,
  type SourceFetcher,
  SourceUrl,
} from "@cortex/domain";
import { htmlToMarkdown } from "./html-to-markdown";

export interface HttpSourceFetcherOptions {
  /** For the whole fetch, redirects included. Default 10s. */
  readonly timeoutMs?: number;
  /** Largest body read. Default 2 MB. */
  readonly maxBytes?: number;
  /** Longest text returned to the model; the rest is cut with a notice. Default 40,000. */
  readonly maxChars?: number;
  /** Default 5. */
  readonly maxRedirects?: number;
  /** Every address a host name resolves to. Defaults to the system resolver. */
  readonly resolve?: (host: string) => Promise<readonly string[]>;
}

const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/**
 * Fetches a web page as Markdown for the brain (E3-US07). Each hop, redirects included, goes
 * through the domain's URL policy and then a DNS check: the request is made only when every
 * address the host resolves to is public. The resolver and fetch look the host up separately,
 * so a DNS answer that changes in between (rebinding) isn't covered; the tool is only open to
 * allowlisted people, and the deployment has no private network to reach.
 */
export class HttpSourceFetcher implements SourceFetcher {
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly maxChars: number;
  private readonly maxRedirects: number;
  private readonly resolve: (host: string) => Promise<readonly string[]>;

  constructor(options: HttpSourceFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxBytes = options.maxBytes ?? 2_000_000;
    this.maxChars = options.maxChars ?? 40_000;
    this.maxRedirects = options.maxRedirects ?? 5;
    this.resolve = options.resolve ?? systemResolve;
  }

  async fetch(url: string): Promise<FetchedSource> {
    const signal = AbortSignal.timeout(this.timeoutMs);
    try {
      return await this.follow(url, signal);
    } catch (error) {
      if (error instanceof SourceFetchError) throw error;
      const timedOut = signal.aborted;
      throw new SourceFetchError(
        url,
        timedOut ? `it took longer than ${this.timeoutMs / 1000}s` : "the request failed",
      );
    }
  }

  private async follow(start: string, signal: AbortSignal): Promise<FetchedSource> {
    let current = start;
    for (let redirects = 0; ; redirects++) {
      const url = SourceUrl.parse(current);
      await this.checkHost(url);
      const response = await fetch(url.value, {
        redirect: "manual",
        signal,
        headers: { accept: "text/html, text/markdown;q=0.9, text/plain;q=0.8" },
      });
      const location = response.headers.get("location");
      if (REDIRECTS.has(response.status) && location !== null) {
        if (redirects >= this.maxRedirects) {
          throw new SourceFetchError(start, `it took more than ${this.maxRedirects} redirects`);
        }
        current = new URL(location, url.value).href;
        // Free the connection: a redirect's body is never read.
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) throw new SourceFetchError(url.value, `HTTP ${response.status}`);
      return this.read(url.value, response);
    }
  }

  private async checkHost(url: SourceUrl): Promise<void> {
    const addresses = await this.resolve(url.address).catch(() => []);
    if (addresses.length === 0) {
      throw new SourceFetchError(url.value, `${url.host} couldn't be resolved`);
    }
    if (addresses.some(isBlockedAddress)) throw new BlockedAddressError(url.value, url.host);
  }

  private async read(url: string, response: Response): Promise<FetchedSource> {
    const contentType = response.headers.get("content-type");
    if (contentType === null) throw new SourceFetchError(url, "it has no content type");
    const [mediaType = "", ...params] = contentType.split(";").map((p) => p.trim().toLowerCase());
    if (!HTML_TYPES.has(mediaType) && !TEXT_TYPES.has(mediaType)) {
      throw new SourceFetchError(url, `${mediaType} isn't a web page or text`);
    }
    const charset = params.find((p) => p.startsWith("charset="))?.slice("charset=".length);
    const body = decode(await this.readCapped(url, response), charset);
    const { title, text } = HTML_TYPES.has(mediaType)
      ? htmlToMarkdown(body, url)
      : { title: textTitle(body, url), text: body.trim() };
    return { title, text: this.cap(text) };
  }

  private async readCapped(url: string, response: Response): Promise<Uint8Array> {
    const tooLarge = () =>
      new SourceFetchError(url, `it's larger than ${Math.floor(this.maxBytes / 1000)} KB`);
    if (Number(response.headers.get("content-length") ?? 0) > this.maxBytes) throw tooLarge();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    // A response with a status and headers always has a body stream here (never a HEAD).
    const reader = (response.body as ReadableStream<Uint8Array<ArrayBuffer>>).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > this.maxBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
    return new Uint8Array(await new Blob(chunks).arrayBuffer());
  }

  private cap(text: string): string {
    if (text.length <= this.maxChars) return text;
    return `${text.slice(0, this.maxChars)}\n\n[Truncated: the page is longer than ${this.maxChars} characters.]`;
  }
}

function decode(bytes: Uint8Array, charset: string | undefined): string {
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
}

/** A Markdown file's first heading, else the last path segment, else the host. */
function textTitle(text: string, url: string): string {
  const heading = /^#\s+(.+)$/m.exec(text)?.[1]?.trim();
  if (heading) return heading;
  const { pathname, hostname } = new URL(url);
  return pathname.split("/").filter(Boolean).at(-1) ?? hostname;
}

async function systemResolve(host: string): Promise<readonly string[]> {
  const { lookup } = await import("node:dns/promises");
  const results = await lookup(host, { all: true, verbatim: true });
  return results.map((result) => result.address);
}
