import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { describeSessionIndexContract } from "../contracts/session-index-contract";
import { FakeUpstash } from "../testing/fake-upstash";
import { UpstashApiError, UpstashSessionIndex } from "./upstash-session-index";

const TOKEN = "upstash_test_SECRET_123";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const fakeUpstash = () => {
  const upstash = new FakeUpstash(TOKEN);
  server.use(...upstash.handlers());
  return upstash;
};
const connect = (upstash: FakeUpstash, token = TOKEN) =>
  new UpstashSessionIndex({ url: upstash.url, token });
const at = new Date(Date.UTC(2026, 10, 15, 9, 0));

describeSessionIndexContract("UpstashSessionIndex", async () => connect(fakeUpstash()));

describe("UpstashSessionIndex", () => {
  it("stores one hash per session and one sorted set per owner, under the cortex prefix", async () => {
    const upstash = fakeUpstash();
    await connect(upstash).record({ owner: "u:1", sessionId: "s/1", title: "T", at });
    expect([...upstash.data.keys()].sort()).toEqual([
      "cortex:session:u%3A1:s%2F1",
      "cortex:sessions:u%3A1",
    ]);
  });

  it("records activity in one transaction, setting the title only if it's new", async () => {
    const upstash = fakeUpstash();
    await connect(upstash).record({ owner: "o", sessionId: "s", title: "T", at });
    expect(upstash.commands).toEqual(["HSETNX", "HSETNX", "HSET", "ZADD"]);
  });

  it("skips listed sessions whose entry is gone or incomplete", async () => {
    const upstash = fakeUpstash();
    const index = connect(upstash);
    await index.record({ owner: "o", sessionId: "s1", title: "One", at });
    await index.record({ owner: "o", sessionId: "s2", title: "Two", at });
    upstash.data.delete("cortex:session:o:s1");
    upstash.data.set("cortex:session:o:s2", new Map([["title", "only a title"]]));
    await expect(index.list("o", 10)).resolves.toEqual([]);
    await expect(index.get("o", "s2")).resolves.toBeNull();
  });

  it("makes no hash reads for an empty list", async () => {
    const upstash = fakeUpstash();
    await expect(connect(upstash).list("nobody", 10)).resolves.toEqual([]);
    expect(upstash.commands).toEqual(["ZREVRANGE"]);
  });

  it("names the command and status on failure, never the token", async () => {
    const upstash = fakeUpstash();
    upstash.failNext = { status: 503, times: 1 };
    await expect(connect(upstash).get("o", "s")).rejects.toThrow(
      new UpstashApiError("HGETALL", 503),
    );
    await expect(connect(upstash, "wrong").get("o", "s")).rejects.toThrow(
      "Upstash HGETALL failed: 401 (check UPSTASH_REDIS_REST_TOKEN)",
    );
    const error = await connect(upstash, "wrong")
      .get("o", "s")
      .catch((e: Error) => e);
    expect(String(error)).not.toContain(TOKEN);
    expect(String(error)).not.toContain("wrong");
  });

  it("raises a command error from inside a transaction", async () => {
    const upstash = fakeUpstash();
    server.use(
      http.post(`${upstash.url}/multi-exec`, () =>
        HttpResponse.json([{ result: 1 }, { error: "WRONGTYPE" }]),
      ),
    );
    await expect(
      connect(upstash).record({ owner: "o", sessionId: "s", title: "T", at }),
    ).rejects.toThrow("Upstash MULTI-EXEC failed: WRONGTYPE");
  });
});
