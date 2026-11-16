import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

type Listed = { sessionId: string; title: string };

// E6-US02 on the in-memory index: the hook lists a web session under its first message, and
// the /sessions route renames and deletes it. Evals share one server, so look up by session id.
export default defineEval({
  description: "A new session is listed by its first message, then renamed and deleted.",
  async test(t) {
    const turn = await t.send("ping");
    turn.succeeded();
    const find = async () => {
      const response = await t.target.fetch("/sessions");
      const { sessions } = (await response.json()) as { sessions: Listed[] };
      return sessions.find((s) => s.sessionId === turn.sessionId)?.title ?? null;
    };
    await t.require(await find(), equals("ping"));

    const query = `/sessions?id=${encodeURIComponent(turn.sessionId)}`;
    const renamed = await t.target.fetch(query, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Renamed" }),
    });
    await t.require(renamed.status, equals(200));
    await t.require(await find(), equals("Renamed"));

    const deleted = await t.target.fetch(query, { method: "DELETE" });
    await t.require(deleted.status, equals(200));
    await t.require(await find(), equals(null));
  },
});
