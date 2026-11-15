import type { SessionSummary } from "../entities/session-summary";
import type { SessionActivity, SessionIndex } from "../ports/session-index";

/** Minimal in-test SessionIndex. The real in-memory twin lives in @cortex/adapters. */
export class FakeSessionIndex implements SessionIndex {
  readonly entries = new Map<string, SessionSummary>();

  async record({ owner, sessionId, title, at }: SessionActivity): Promise<void> {
    const key = `${owner}/${sessionId}`;
    const existing = this.entries.get(key);
    this.entries.set(key, {
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
    return this.entries.get(`${owner}/${sessionId}`) ?? null;
  }

  async rename(owner: string, sessionId: string, title: string): Promise<boolean> {
    const existing = await this.get(owner, sessionId);
    if (!existing) return false;
    this.entries.set(`${owner}/${sessionId}`, { ...existing, title });
    return true;
  }

  async remove(owner: string, sessionId: string): Promise<boolean> {
    return this.entries.delete(`${owner}/${sessionId}`);
  }
}
