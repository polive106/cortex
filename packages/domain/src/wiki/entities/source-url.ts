import { BlockedAddressError, SourceFetchError } from "../errors";

/** IPv4 ranges that aren't the public internet: [network, prefix length]. */
const BLOCKED_V4_RANGES: readonly (readonly [string, number])[] = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, and broadcast
];

/** The ranges as [network, mask] numbers, computed once. */
const BLOCKED_V4 = BLOCKED_V4_RANGES.map(([network, bits]) => {
  const mask = (~0 << (32 - bits)) >>> 0;
  return [((parseV4(network) as number) & mask) >>> 0, mask] as const;
});

/** Host names that only mean something inside a network. */
const LOCAL_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

/**
 * A URL the companion may fetch (E3-US07): http(s), no credentials, and a host that isn't a
 * private or local address. The fetcher resolves the host and checks every address again, since
 * a public name can point anywhere.
 */
export class SourceUrl {
  private constructor(
    readonly value: string,
    /** As the URL writes it: an IPv6 address keeps its brackets. */
    readonly host: string,
  ) {}

  /** The host as DNS and IP checks take it, IPv6 without brackets. */
  get address(): string {
    return unbracket(this.host);
  }

  static parse(input: string): SourceUrl {
    const raw = input.trim();
    const url = URL.parse(raw);
    if (url === null) throw new SourceFetchError(raw, "it isn't a valid URL");
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new SourceFetchError(raw, "only http and https URLs can be fetched");
    }
    if (url.username !== "" || url.password !== "") {
      throw new SourceFetchError(raw, "URLs with credentials can't be fetched");
    }
    url.hash = "";
    // URL already normalized the host: lowercase, IPv4 in dotted form, IPv6 in brackets.
    const host = url.hostname;
    if (isLocalName(host) || (isIpLiteral(host) && isBlockedAddress(unbracket(host)))) {
      throw new BlockedAddressError(url.href, host);
    }
    return new SourceUrl(url.href, host);
  }
}

function isLocalName(host: string): boolean {
  if (isIpLiteral(host)) return false;
  return (
    host === "localhost" || !host.includes(".") || LOCAL_SUFFIXES.some((s) => host.endsWith(s))
  );
}

function isIpLiteral(host: string): boolean {
  return host.startsWith("[") || parseV4(host) !== undefined;
}

const unbracket = (host: string) => host.replace(/^\[|\]$/g, "");

/**
 * Whether an IP address (as DNS returns it, IPv4 or IPv6) is private, local, or reserved.
 * Anything that doesn't parse as an IP counts as blocked, so callers fail closed.
 */
export function isBlockedAddress(ip: string): boolean {
  const v4 = parseV4(ip);
  if (v4 !== undefined) return isBlockedV4(v4);
  const v6 = parseV6(ip);
  return v6 === undefined || isBlockedV6(v6);
}

function isBlockedV4(address: number): boolean {
  return BLOCKED_V4.some(([network, mask]) => (address & mask) >>> 0 === network);
}

function isBlockedV6(h: readonly number[]): boolean {
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, last = 0] = h;
  const embedded = (hi: number, lo: number) => isBlockedV4(((hi << 16) | lo) >>> 0);
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0) {
    // ::, ::1, and IPv4-mapped ::ffff:a.b.c.d
    if (f === 0xffff) return embedded(g, last);
    return f === 0 && g === 0 && last <= 1;
  }
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) {
    return embedded(g, last); // NAT64
  }
  if (a === 0x2002) return embedded(b, c); // 6to4
  if (a === 0x2001 && b === 0x0db8) return true; // documentation
  if (a === 0x0100 && b === 0 && c === 0 && d === 0) return true; // discard
  return (a & 0xfe00) === 0xfc00 || (a & 0xffc0) === 0xfe80 || (a & 0xff00) === 0xff00;
}

/** A dotted-quad IPv4 address as an unsigned 32-bit number, or undefined. */
function parseV4(ip: string): number | undefined {
  const parts = ip.split(".");
  if (parts.length !== 4 || !parts.every((p) => /^(0|[1-9]\d{0,2})$/.test(p))) return undefined;
  const octets = parts.map(Number);
  if (octets.some((o) => o > 255)) return undefined;
  return octets.reduce((n, o) => n * 256 + o, 0);
}

/** An IPv6 address as eight 16-bit groups, or undefined. Accepts a trailing dotted IPv4. */
function parseV6(ip: string): number[] | undefined {
  let text = ip;
  if (ip.includes(".")) {
    // "::ffff:1.2.3.4": turn the dotted tail into its two groups.
    const [, prefix = "", dotted = ""] = /^(.*:)([^:]*)$/.exec(ip) ?? [];
    const v4 = parseV4(dotted);
    if (v4 === undefined) return undefined;
    text = `${prefix}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return undefined;
  const groups = (s = "") => (s === "" ? [] : s.split(":"));
  const head = groups(halves[0]);
  const rest = groups(halves[1]);
  if (![...head, ...rest].every((g) => /^[0-9a-f]{1,4}$/i.test(g))) return undefined;
  const total = head.length + rest.length;
  if (halves.length === 1 ? total !== 8 : total > 7) return undefined;
  // Without "::" there are already eight groups, so this adds none.
  const fill = Array<string>(8 - total).fill("0");
  return [...head, ...fill, ...rest].map((g) => Number.parseInt(g, 16));
}
