import type { SessionActivity, SessionIndex, SessionSummary } from "@cortex/domain";

/** SessionIndex twin for dev, evals, and E2E (ADR-0013). Lasts as long as the process. */
export class InMemorySessionIndex implements SessionIndex {
  private readonly entries = new Map<string, SessionSummary>();

  async record({ owner, sessionId, title, at }: SessionActivity): Promise<void> {
    const existing = this.entries.get(key(owner, sessionId));
    this.entries.set(key(owner, sessionId), {
      sessionId,
      owner,
      title: existing?.title ?? title,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    });
  }

  async list(owner: string, limit: number): Promise<SessionSummary[]> {
    return [...this.entries.values()]
      .filter((entry) => entry.owner === owner)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async get(owner: string, sessionId: string): Promise<SessionSummary | null> {
    return this.entries.get(key(owner, sessionId)) ?? null;
  }

  async rename(owner: string, sessionId: string, title: string): Promise<boolean> {
    const existing = this.entries.get(key(owner, sessionId));
    if (!existing) return false;
    this.entries.set(key(owner, sessionId), { ...existing, title });
    return true;
  }

  async remove(owner: string, sessionId: string): Promise<boolean> {
    return this.entries.delete(key(owner, sessionId));
  }
}

// The pair as JSON can't collide, whatever characters the owner or ID hold.
const key = (owner: string, sessionId: string) => JSON.stringify([owner, sessionId]);
