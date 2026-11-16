import { STARTER_BRAIN } from "./starter-brain";

/**
 * A linked example brain for demos and screenshots of the brain graph (E7-US01). With
 * BRAIN_STORE=memory, BRAIN_SEED=sample seeds it instead of the near-empty starter brain.
 */
interface SamplePage {
  readonly title: string;
  readonly summary: string;
  readonly links?: readonly string[];
  /** Left out of index.md: reachable only through links, like a real wiki's leaves. */
  readonly unindexed?: boolean;
}

const PAGES: Readonly<Record<string, SamplePage>> = {
  "seed-round": {
    title: "Seed round",
    summary: "The 2026 seed: who, how much, on what terms",
    links: ["pitch-deck", "investor-crm", "safe-note"],
  },
  "pitch-deck": {
    title: "Pitch deck",
    summary: "The current deck and the story it tells",
    links: ["product-roadmap", "board-updates"],
  },
  "investor-crm": {
    title: "Investor CRM",
    summary: "Who we talked to and where each conversation stands",
  },
  "term-sheet": {
    title: "Term sheet",
    summary: "Key terms we accepted and the ones we pushed back on",
    links: ["valuation", "cap-table"],
  },
  "cap-table": {
    title: "Cap table",
    summary: "Ownership after the seed",
    links: ["market-size", "due-diligence"],
  },
  "market-size": {
    title: "Market size",
    summary: "TAM, SAM, SOM and how we got the numbers",
    links: ["competitor-map"],
  },
  "competitor-map": {
    title: "Competitor map",
    summary: "Who else is in the space and how we differ",
    links: ["culture-docs", "equity-plan"],
  },
  "culture-docs": {
    title: "Culture docs",
    summary: "How we work together",
    links: ["pricing-strategy"],
  },
  "pricing-strategy": {
    title: "Pricing strategy",
    summary: "Tiers, anchors and the experiments behind them",
    links: ["growth-metrics", "churn-analysis"],
  },
  "growth-metrics": {
    title: "Growth metrics",
    summary: "The weekly numbers we watch",
    links: ["churn-analysis"],
  },
  "churn-analysis": {
    title: "Churn analysis",
    summary: "Why customers leave and what we changed",
    links: ["retention-loops"],
  },
  "hiring-pipeline": {
    title: "Hiring pipeline",
    summary: "Open roles and where candidates are",
    links: ["equity-plan", "churn-analysis"],
  },
  "equity-plan": {
    title: "Equity plan",
    summary: "The option pool and how grants are sized",
    links: ["onboarding-flow"],
  },
  "go-to-market": {
    title: "Go-to-market",
    summary: "Who we sell to first and through which channels",
    links: ["feature-flags", "growth-metrics"],
  },
  "mvp-decisions": {
    title: "MVP decisions",
    summary: "What made the cut for v1, and why",
    links: ["user-research", "nps-scores", "feature-flags", "go-to-market"],
  },
  "user-research": {
    title: "User research",
    summary: "What we learned from talking to users",
    links: ["user-interviews", "product-roadmap"],
  },
  "product-roadmap": {
    title: "Product roadmap",
    summary: "What we build next quarter",
    links: ["demo-day"],
  },
  "feature-flags": {
    title: "Feature flags",
    summary: "How we roll features out",
    links: ["a-b-testing"],
    unindexed: true,
  },
  "safe-note": { title: "SAFE note", summary: "The SAFE we signed with angels", unindexed: true },
  "board-updates": { title: "Board updates", summary: "Monthly investor letters", unindexed: true },
  valuation: { title: "Valuation", summary: "How we priced the round", unindexed: true },
  "due-diligence": { title: "Due diligence", summary: "The data room checklist", unindexed: true },
  "onboarding-flow": {
    title: "Onboarding flow",
    summary: "A new hire's first week",
    unindexed: true,
  },
  "retention-loops": {
    title: "Retention loops",
    summary: "What brings users back",
    unindexed: true,
  },
  "demo-day": { title: "Demo day", summary: "Our three minutes on stage", unindexed: true },
  "user-interviews": { title: "User interviews", summary: "Raw interview notes", unindexed: true },
  "nps-scores": { title: "NPS scores", summary: "Net promoter score by month", unindexed: true },
  "a-b-testing": { title: "A/B testing", summary: "How we run experiments", unindexed: true },
};

const page = (slug: string, { title, summary, links = [] }: SamplePage) => {
  const related = links.map((link) => `[${PAGES[link]?.title}](${link}.md)`).join(", ");
  const body = related ? `${summary}.\n\nRelated: ${related}.\n` : `${summary}.\n`;
  return [
    `wiki/${slug}.md`,
    `---\ntitle: ${title}\nsummary: ${summary}\nsources: []\nupdated: 2026-11-14\n---\n\n${body}`,
  ];
};

const index = Object.entries(PAGES)
  .filter(([, sample]) => !sample.unindexed)
  .map(([slug, { title, summary }]) => `- [${title}](wiki/${slug}.md) — ${summary}`);

export const SAMPLE_BRAIN: Readonly<Record<string, string>> = {
  ...STARTER_BRAIN,
  "index.md": `${STARTER_BRAIN["index.md"]}${index.join("\n")}\n`,
  ...Object.fromEntries(Object.entries(PAGES).map(([slug, sample]) => page(slug, sample))),
};
