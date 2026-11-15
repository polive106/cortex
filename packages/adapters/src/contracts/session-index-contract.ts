import type { SessionIndex } from "@cortex/domain";
import { describe, expect, it } from "vitest";

const at = (minute: number) => new Date(Date.UTC(2026, 10, 15, 9, minute));

/** Behavior every SessionIndex shares (ADR-0002, ADR-0013), so the twin can stand in for Redis. */
export function describeSessionIndexContract(name: string, make: () => Promise<SessionIndex>) {
  describe(`${name} (SessionIndex contract)`, () => {
    const seeded = async () => {
      const index = await make();
      await index.record({ owner: "alice", sessionId: "s1", title: "First", at: at(1) });
      await index.record({ owner: "alice", sessionId: "s2", title: "Second", at: at(2) });
      await index.record({ owner: "bob", sessionId: "s3", title: "Bob's", at: at(3) });
      return index;
    };

    it("records a new session and reads it back", async () => {
      const index = await seeded();
      await expect(index.get("alice", "s1")).resolves.toEqual({
        sessionId: "s1",
        owner: "alice",
        title: "First",
        createdAt: at(1),
        updatedAt: at(1),
      });
      await expect(index.get("alice", "missing")).resolves.toBeNull();
    });

    it("lists the owner's sessions, newest activity first, up to the limit", async () => {
      const index = await seeded();
      await index.record({ owner: "alice", sessionId: "s1", title: "ignored", at: at(5) });
      const all = await index.list("alice", 10);
      expect(all.map((s) => s.sessionId)).toEqual(["s1", "s2"]);
      await expect(index.list("alice", 1)).resolves.toHaveLength(1);
      await expect(index.list("nobody", 10)).resolves.toEqual([]);
    });

    it("keeps the title and creation time on later activity", async () => {
      const index = await seeded();
      await index.record({ owner: "alice", sessionId: "s1", title: "ignored", at: at(5) });
      await expect(index.get("alice", "s1")).resolves.toMatchObject({
        title: "First",
        createdAt: at(1),
        updatedAt: at(5),
      });
    });

    it("renames, and a later turn keeps the new title", async () => {
      const index = await seeded();
      await expect(index.rename("alice", "s1", "Renamed")).resolves.toBe(true);
      await index.record({ owner: "alice", sessionId: "s1", title: "ignored", at: at(6) });
      await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "Renamed" });
    });

    it("removes a session from the list", async () => {
      const index = await seeded();
      await expect(index.remove("alice", "s1")).resolves.toBe(true);
      await expect(index.get("alice", "s1")).resolves.toBeNull();
      await expect(index.list("alice", 10)).resolves.toMatchObject([{ sessionId: "s2" }]);
      await expect(index.remove("alice", "s1")).resolves.toBe(false);
    });

    it("never lets one owner see or change another's sessions", async () => {
      const index = await seeded();
      await expect(index.get("bob", "s1")).resolves.toBeNull();
      await expect(index.rename("bob", "s1", "Mine")).resolves.toBe(false);
      await expect(index.remove("bob", "s1")).resolves.toBe(false);
      await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "First" });
    });

    it("keeps owners and IDs with separators apart", async () => {
      const index = await make();
      await index.record({ owner: "a:b", sessionId: "c", title: "one", at: at(1) });
      await index.record({ owner: "a", sessionId: "b:c", title: "two", at: at(2) });
      await expect(index.get("a:b", "c")).resolves.toMatchObject({ title: "one" });
      await expect(index.get("a", "b:c")).resolves.toMatchObject({ title: "two" });
    });
  });
}
