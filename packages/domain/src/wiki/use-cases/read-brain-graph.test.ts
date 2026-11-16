import { describe, expect, it, vi } from "vitest";
import { Changeset } from "../entities/changeset";
import type { Clock } from "../ports/clock";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { ReadBrainGraph } from "./read-brain-graph";

/** A clock the test moves by hand. */
const manualClock = () => {
  let ms = 0;
  const clock: Clock = { now: () => new Date(ms) };
  return { clock, advance: (by: number) => (ms += by) };
};

describe("ReadBrainGraph", () => {
  it("builds the graph from index.md and the pages, tagged with the head", async () => {
    const store = new FakeWikiStore({
      "index.md": "- [A](wiki/a.md) — a\n",
      "wiki/a.md": "[B](b.md)",
      "wiki/b.md": "",
    });
    const { ref, graph } = await new ReadBrainGraph(store, manualClock().clock).execute();
    expect(ref).toBe("commit-0");
    expect(graph.nodes.map((node) => node.id)).toEqual(["index.md", "wiki/a.md", "wiki/b.md"]);
    expect(graph.edges).toHaveLength(2);
  });

  it("answers from its last result while fresh, and rebuilds only when the head moved", async () => {
    const store = new FakeWikiStore({ "wiki/a.md": "" });
    const head = vi.spyOn(store, "head");
    const readPages = vi.spyOn(store, "readPages");
    const { clock, advance } = manualClock();
    const useCase = new ReadBrainGraph(store, clock, 1_000);
    const first = await useCase.execute();

    advance(500);
    expect(await useCase.execute()).toBe(first);
    expect(head).toHaveBeenCalledTimes(1);

    advance(1_000);
    expect(await useCase.execute()).toBe(first);
    expect(head).toHaveBeenCalledTimes(2);
    expect(readPages).toHaveBeenCalledTimes(1);

    await store.commit(new Changeset().write("wiki/b.md", ""), "add b");
    advance(1_000);
    const next = await useCase.execute();
    expect(next.ref).toBe("commit-1");
    expect(next.graph.nodes).toHaveLength(3);
    expect(readPages).toHaveBeenCalledTimes(2);
  });

  it("shares a build already in flight", async () => {
    const store = new FakeWikiStore({ "wiki/a.md": "" });
    const readPages = vi.spyOn(store, "readPages");
    const useCase = new ReadBrainGraph(store, manualClock().clock);
    const [a, b] = await Promise.all([useCase.execute(), useCase.execute()]);
    expect(a).toBe(b);
    expect(readPages).toHaveBeenCalledTimes(1);
  });
});
