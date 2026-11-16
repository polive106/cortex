import type { SessionActivity, SessionIndex, SessionSummary } from "@cortex/domain";

export interface UpstashSessionIndexOptions {
  /** UPSTASH_REDIS_REST_URL, e.g. https://<db>.upstash.io */
  readonly url: string;
  /** UPSTASH_REDIS_REST_TOKEN */
  readonly token: string;
  readonly fetch?: typeof fetch;
}

/** A failed Upstash call. The message names the command and status, never credentials. */
export class UpstashApiError extends Error {
  constructor(
    readonly command: string,
    readonly status: number | string,
  ) {
    const hint = status === 401 || status === 403 ? " (check UPSTASH_REDIS_REST_TOKEN)" : "";
    super(`Upstash ${command} failed: ${status}${hint}`);
    this.name = "UpstashApiError";
  }
}

type Command = (string | number)[];
type Reply = { result?: unknown; error?: string };

// Owners and IDs are encoded, so a ":" in either can't make two keys collide.
const enc = encodeURIComponent;
const sessionKey = (owner: string, sessionId: string) =>
  `cortex:session:${enc(owner)}:${enc(sessionId)}`;
const ownerKey = (owner: string) => `cortex:sessions:${enc(owner)}`;

/**
 * Each user's session list in Upstash Redis over its REST API (ADR-0013): a hash per session
 * (title, createdAt, updatedAt) and a sorted set per owner scored by updatedAt. Activity sets
 * the title with HSETNX, so a turn never overwrites a rename.
 */
export class UpstashSessionIndex implements SessionIndex {
  readonly #token: string;
  readonly #fetch: typeof fetch;
  private readonly url: string;

  constructor(options: UpstashSessionIndexOptions) {
    this.#token = options.token;
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.url = options.url.replace(/\/+$/, "");
  }

  async record({ owner, sessionId, title, at }: SessionActivity): Promise<void> {
    const key = sessionKey(owner, sessionId);
    await this.transaction([
      ["HSETNX", key, "title", title],
      ["HSETNX", key, "createdAt", at.toISOString()],
      ["HSET", key, "updatedAt", at.toISOString()],
      ["ZADD", ownerKey(owner), at.getTime(), sessionId],
    ]);
  }

  async list(owner: string, limit: number): Promise<SessionSummary[]> {
    const ids = (await this.command(["ZREVRANGE", ownerKey(owner), 0, limit - 1])) as string[];
    if (ids.length === 0) return [];
    const hashes = await this.pipeline(ids.map((id) => ["HGETALL", sessionKey(owner, id)]));
    return ids.flatMap((id, i) => {
      const summary = toSummary(owner, id, hashes[i] as string[]);
      return summary ? [summary] : [];
    });
  }

  async get(owner: string, sessionId: string): Promise<SessionSummary | null> {
    const hash = await this.command(["HGETALL", sessionKey(owner, sessionId)]);
    return toSummary(owner, sessionId, hash as string[]);
  }

  async rename(owner: string, sessionId: string, title: string): Promise<boolean> {
    // A remove racing this can leave a title-only hash; get and list ignore incomplete ones.
    if (!(await this.get(owner, sessionId))) return false;
    await this.command(["HSET", sessionKey(owner, sessionId), "title", title]);
    return true;
  }

  async remove(owner: string, sessionId: string): Promise<boolean> {
    const [deleted] = await this.transaction([
      ["DEL", sessionKey(owner, sessionId)],
      ["ZREM", ownerKey(owner), sessionId],
    ]);
    return deleted === 1;
  }

  private async command(command: Command): Promise<unknown> {
    const [reply] = await this.send("", String(command[0]), command);
    return reply;
  }

  private pipeline(commands: Command[]): Promise<unknown[]> {
    return this.send("/pipeline", "PIPELINE", commands);
  }

  private transaction(commands: Command[]): Promise<unknown[]> {
    return this.send("/multi-exec", "MULTI-EXEC", commands);
  }

  private async send(path: string, name: string, body: unknown): Promise<unknown[]> {
    const response = await this.#fetch(`${this.url}${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.#token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new UpstashApiError(name, response.status);
    const json = (await response.json()) as Reply | Reply[];
    const replies = Array.isArray(json) ? json : [json];
    const failed = replies.find((reply) => reply.error !== undefined);
    if (failed) throw new UpstashApiError(name, failed.error as string);
    return replies.map((reply) => reply.result);
  }
}

function toSummary(owner: string, sessionId: string, flat: string[]): SessionSummary | null {
  const fields = new Map<string, string>();
  for (let i = 0; i < flat.length; i += 2) fields.set(flat[i] as string, flat[i + 1] as string);
  const title = fields.get("title");
  const createdAt = fields.get("createdAt");
  const updatedAt = fields.get("updatedAt");
  if (!title || !createdAt || !updatedAt) return null;
  return {
    sessionId,
    owner,
    title,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}
