import { HttpResponse, http, type JsonBodyType } from "msw";

type Value = Map<string, string> | Map<string, number>;
type Command = readonly (string | number)[];
type Reply = { result: JsonBodyType } | { error: string };

/**
 * A stateful fake of the slice of the Upstash Redis REST API that UpstashSessionIndex uses:
 * single commands, /pipeline and /multi-exec, over hashes and sorted sets. Tests use it with msw,
 * never the real Upstash (ADR-0007).
 */
export class FakeUpstash {
  readonly url = "https://redis.upstash.test";
  readonly commands: string[] = [];
  /** The next N requests answer with this HTTP status. */
  failNext: { status: number; times: number } = { status: 500, times: 0 };
  readonly data = new Map<string, Value>();

  constructor(readonly token: string) {}

  handlers() {
    const guard = async (request: Request, run: (body: unknown) => JsonBodyType) => {
      if (request.headers.get("authorization") !== `Bearer ${this.token}`) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (this.failNext.times > 0) {
        this.failNext.times -= 1;
        return HttpResponse.json({ error: "boom" }, { status: this.failNext.status });
      }
      return HttpResponse.json(run(await request.json()));
    };
    const batch = (path: string) =>
      http.post(`${this.url}${path}`, ({ request }) =>
        guard(request, (body) => (body as Command[]).map((command) => this.run(command))),
      );
    return [
      batch("/pipeline"),
      batch("/multi-exec"),
      http.post(this.url, ({ request }) => guard(request, (body) => this.run(body as Command))),
    ];
  }

  private run([name, ...args]: Command): Reply {
    const command = String(name).toUpperCase();
    this.commands.push(command);
    const [key = "", ...rest] = args.map(String);
    switch (command) {
      case "HSET":
      case "HSETNX": {
        const hash = this.hash(key);
        let added = 0;
        for (let i = 0; i < rest.length; i += 2) {
          const field = rest[i] as string;
          if (command === "HSETNX" && hash.has(field)) continue;
          if (!hash.has(field)) added += 1;
          hash.set(field, rest[i + 1] as string);
        }
        return { result: added };
      }
      case "HGETALL":
        return { result: [...(this.data.get(key)?.entries() ?? [])].flat() };
      case "EXISTS":
        return { result: this.data.has(key) ? 1 : 0 };
      case "DEL":
        return { result: this.data.delete(key) ? 1 : 0 };
      case "ZADD": {
        const set = this.zset(key);
        set.set(rest[1] as string, Number(rest[0]));
        return { result: 1 };
      }
      case "ZREM": {
        const set = this.zset(key);
        const removed = set.delete(rest[0] as string) ? 1 : 0;
        if (set.size === 0) this.data.delete(key);
        return { result: removed };
      }
      case "ZREVRANGE": {
        const sorted = [...this.zset(key).entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([member]) => member);
        return { result: sorted.slice(Number(rest[0]), Number(rest[1]) + 1) };
      }
      default:
        return { error: `ERR unknown command '${command}'` };
    }
  }

  private hash(key: string): Map<string, string> {
    return this.entry<string>(key);
  }

  private zset(key: string): Map<string, number> {
    return this.entry<number>(key);
  }

  /** The value at `key`, created empty. The fake doesn't check types, unlike Redis. */
  private entry<V>(key: string): Map<string, V> {
    const value = this.data.get(key) ?? new Map<string, V>();
    this.data.set(key, value as Value);
    return value as Map<string, V>;
  }
}
