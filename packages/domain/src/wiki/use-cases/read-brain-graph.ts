import { BrainGraph } from "../entities/brain-graph";
import type { Clock } from "../ports/clock";
import type { WikiStore } from "../ports/wiki-store";

export interface BrainGraphView {
  /** The head commit the graph was built from. */
  readonly ref: string;
  readonly graph: BrainGraph;
}

/**
 * The brain's pages and the links between them, for the live graph (E7-US01, ADR-0015). Every
 * tab polls it, so it answers from its last result for `freshMs` (one head lookup shared by all
 * callers), shares a build already in flight, and rebuilds only when the head has moved.
 */
export class ReadBrainGraph {
  private last?: { view: BrainGraphView; at: number };
  private pending?: Promise<BrainGraphView>;

  constructor(
    private readonly store: WikiStore,
    private readonly clock: Clock,
    private readonly freshMs = 2_000,
  ) {}

  execute(): Promise<BrainGraphView> {
    const now = this.clock.now().getTime();
    if (this.last && now - this.last.at < this.freshMs) return Promise.resolve(this.last.view);
    this.pending ??= this.refresh(now).finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async refresh(now: number): Promise<BrainGraphView> {
    const ref = await this.store.head();
    if (this.last?.view.ref !== ref) {
      const [index, pages] = await Promise.all([
        this.store.readFile("index.md"),
        this.store.readPages(),
      ]);
      this.last = { view: { ref, graph: BrainGraph.build(index, pages) }, at: now };
    } else {
      this.last = { ...this.last, at: now };
    }
    return this.last.view;
  }
}
