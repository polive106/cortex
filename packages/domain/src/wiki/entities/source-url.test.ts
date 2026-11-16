import { describe, expect, it } from "vitest";
import { BlockedAddressError, SourceFetchError } from "../errors";
import { isBlockedAddress, SourceUrl } from "./source-url";

describe("SourceUrl", () => {
  it.each([
    ["https://example.com/post", "https://example.com/post"],
    ["http://example.com", "http://example.com/"],
    ["  https://Example.COM/a?b=1#frag  ", "https://example.com/a?b=1"],
    ["https://8.8.8.8/x", "https://8.8.8.8/x"],
    ["https://[2606:4700::1111]/", "https://[2606:4700::1111]/"],
  ])("accepts %s as %s, without the fragment", (input, value) => {
    const url = SourceUrl.parse(input);
    expect(url.value).toBe(value);
    expect(url.host).toBe(new URL(value).hostname);
  });

  it("gives the bare address for DNS and IP checks", () => {
    expect(SourceUrl.parse("https://[2606:4700::1111]/").address).toBe("2606:4700::1111");
    expect(SourceUrl.parse("https://example.com/").address).toBe("example.com");
  });

  it.each([
    ["not a url", "isn't a valid URL"],
    ["ftp://example.com/file", "only http and https URLs can be fetched"],
    ["file:///etc/passwd", "only http and https URLs can be fetched"],
    ["javascript:alert(1)", "only http and https URLs can be fetched"],
    ["https://user:pass@example.com/", "URLs with credentials can't be fetched"],
  ])("refuses %s", (input, reason) => {
    const parse = () => SourceUrl.parse(input);
    expect(parse).toThrow(SourceFetchError);
    expect(parse).toThrow(reason);
  });

  it.each([
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1:8080/",
    "http://2130706433/",
    "http://0x7f.0.0.1/",
    "http://10.1.2.3/",
    "http://192.168.0.1/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[fd00::1]/",
    "http://localhost:3000/",
    "http://api.localhost/",
    "http://printer.local/",
    "http://metadata.google.internal/",
    "http://intranet/",
  ])("blocks the private or local address in %s", (input) => {
    const parse = () => SourceUrl.parse(input);
    expect(parse).toThrow(BlockedAddressError);
    expect(parse).toThrow("is a private or local address");
  });
});

describe("isBlockedAddress", () => {
  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.0.0.8",
    "192.0.2.1",
    "192.168.1.1",
    "198.18.0.1",
    "198.51.100.7",
    "203.0.113.9",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "::ffff:10.0.0.1",
    "::ffff:a00:1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::",
    "2001:db8::1",
    "100::1",
  ])("blocks %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "172.32.0.1",
    "100.128.0.1",
    "93.184.216.34",
    "2606:4700::1111",
    "2a00:1450:4007::200e",
    "::ffff:8.8.8.8",
    "2002:808:808::",
  ])("allows the public address %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it.each([
    "",
    "999.1.1.1",
    "1.2.3",
    "1.2.3.4.5",
    "01.2.3.4",
    "example.com",
    "1::2::3",
    "12345::",
    "1:2:3:4:5:6:7:8:9",
    "1:2:3",
    "::ffff:1.2.3.999",
  ])("treats %j, which isn't an IP, as blocked", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });
});
