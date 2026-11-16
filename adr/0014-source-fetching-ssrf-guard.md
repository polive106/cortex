# ADR-0014: Fetching web sources: public http(s) only, pinned to checked addresses

## Status

Accepted

## Context

E3-US07 lets companion fetch a URL someone pastes and save it to the brain. The URL comes from chat, and it can also come from a prompt injection in a page or a source, so the fetch is a server-side request forgery (SSRF) risk. The host could be a loopback or private address, the cloud metadata endpoint (`169.254.169.254`), a public name that resolves to one of those, or a redirect to one. Checking a name's DNS answer and then letting the HTTP client look the name up again leaves a rebinding window: the second answer can differ from the one that was checked. The domain has zero dependencies (ADR-0002), and adapters that call HTTP are tested with msw (ADR-0007).

## Decision

- **The policy is in the domain.** `SourceUrl.parse` accepts only `http:` and `https:` URLs without credentials. It refuses `localhost`, `*.localhost`, `*.local`, `*.internal`, `*.home.arpa`, single-label names, and literal private, loopback, link-local, CGNAT, documentation, multicast, and reserved IPv4 and IPv6 addresses, including the IPv4 forms embedded in IPv4-mapped, NAT64, and 6to4 addresses. A refusal is a `BlockedAddressError`. `isBlockedAddress(ip)` is the same check for resolved addresses. Anything it can't parse counts as blocked.
- **`FetchSource` runs the policy before the port.** `HttpSourceFetcher` runs it again on every redirect hop.
- **On every hop, the host is resolved once.** Every address it resolves to must pass `isBlockedAddress`. The connection is then made only to those addresses: `pinnedTransport` hands node's socket a lookup that returns the checked list, never a fresh DNS answer, and TLS still verifies the URL's host name.
- **Each fetch has limits:** 10s for the whole fetch, 2 MB of body, 40,000 characters returned to the model, and 5 redirects. Only HTML, plain text, and Markdown are accepted.
- **`fetch_source` is read-only** and needs no approval. Fetched text is data, never instructions.
- **Evals and E2E use the in-memory twin** (`SOURCE_FETCHER=memory`), so they never reach the network.
- **Never loosen any of this.** A wider policy needs a new ADR.

## Consequences

### Positive
- A pasted or injected URL can't reach the deployment's own network or metadata services, whether directly, through DNS, or through a redirect.
- The policy is pure and fully unit-tested in the domain, and the adapter adds only resolution and pinning.

### Negative
- Pages on private hosts can't be ingested. Paste their text instead.
- The default transport is node's `http(s)`, which msw doesn't intercept here. Fetcher tests inject a fetch-based transport, and the pinned transport has its own tests against a local loopback server.
- The HTML to Markdown pass is a small regex converter, so complex pages lose some structure.

## Alternatives Considered
- **Check DNS, then use global `fetch`**: leaves the rebinding window between the check and the connection.
- **An undici `Agent` with a custom `connect.lookup` as `fetch`'s dispatcher**: adds a dependency tied to node's bundled undici version.
- **An allowlist of hosts**: too narrow for "save this link". The blocklist of non-public ranges covers the risk.
