import {
  BlockedAddressError,
  type FetchedSource,
  isBlockedAddress,
  SourceFetchError,
  type SourceFetcher,
  SourceUrl,
} from "@cortex/domain";
import { htmlToMarkdown } from "./html-to-markdown";
import { pinnedTransport, type Transport } from "./pinned-transport";

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
  /** Sends one GET to the checked addresses only. Defaults to `pinnedTransport`. */
  readonly transport?: Transport;
}

const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/**
 * Fetches a web page as Markdown for the brain (E3-US07). Each hop, redirects included, goes
 * through the domain's URL policy, then resolves the host once and requires every address to be
 * public. The transport connects only to those checked addresses, so a DNS answer that changes
 * afterwards (rebinding) is never used.
 */
export class HttpSourceFetcher implements SourceFetcher {
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly maxChars: number;
  private readonly maxRedirects: number;
  private readonly resolve: (host: string) => Promise<readonly string[]>;
  private readonly transport: Transport;

  constructor(options: HttpSourceFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxBytes = options.maxBytes ?? 2_000_000;
    this.maxChars = options.maxChars ?? 40_000;
    this.maxRedirects = options.maxRedirects ?? 5;
    this.resolve = options.resolve ?? systemResolve;
    this.transport = options.transport ?? pinnedTransport;
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
      const response = await this.transport(url.value, await this.checkedAddresses(url), signal);
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

  /** The host's addresses, every one of them public, or a fetch error. */
  private async checkedAddresses(url: SourceUrl): Promise<readonly string[]> {
    const addresses = await this.resolve(url.address).catch(() => []);
    if (addresses.length === 0) {
      throw new SourceFetchError(url.value, `${url.host} couldn't be resolved`);
    }
    if (addresses.some(isBlockedAddress)) throw new BlockedAddressError(url.value, url.host);
    return addresses;
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
