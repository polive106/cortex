import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { Readable } from "node:stream";

/** Sends one GET for `url` to one of `addresses`, never following redirects. */
export type Transport = (
  url: string,
  addresses: readonly string[],
  signal: AbortSignal,
) => Promise<Response>;

const ACCEPT = "text/html, text/markdown;q=0.9, text/plain;q=0.8";
/** Statuses a Response can't carry a body for. */
const NO_BODY = new Set([101, 204, 205, 304]);

/**
 * The default transport: node's http(s), with a socket lookup that hands back the checked
 * addresses instead of asking DNS again (no rebinding window). TLS still verifies the URL's
 * host name, and the response streams as a web Response.
 */
export const pinnedTransport: Transport = async (url, addresses, signal) => {
  const request = url.startsWith("https:") ? httpsRequest : httpRequest;
  const lookup = pinnedLookup(addresses);
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { accept: ACCEPT }, lookup, signal }, (res) => {
      const status = res.statusCode as number;
      const body = NO_BODY.has(status) ? null : (Readable.toWeb(res) as ReadableStream);
      resolve(new Response(body, { status, headers: toHeaders(res.headers) }));
    });
    req.on("error", reject);
    req.end();
  });
};

function toHeaders(raw: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : [value ?? ""]) headers.append(name, item);
  }
  return headers;
}

/** A socket lookup that answers with `addresses` (never empty) whatever the host name. */
export function pinnedLookup(addresses: readonly string[]): LookupFunction {
  const pinned = addresses.map((address) => ({ address, family: isIP(address) }));
  const first = pinned[0]!;
  // node's callback type has one overload per `all`; this answers both.
  return ((_host, options, callback: (...args: unknown[]) => void) => {
    if (options.all) callback(null, pinned);
    else callback(null, first.address, first.family);
  }) as LookupFunction;
}
