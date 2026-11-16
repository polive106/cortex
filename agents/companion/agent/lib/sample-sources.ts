import type { FetchedSource } from "@cortex/domain";

/**
 * The web as flow evals and E2E see it (SOURCE_FETCHER=memory, E3-US07): fixed pages, so those
 * runs never reach the network.
 */
export const SAMPLE_SOURCES: Readonly<Record<string, FetchedSource>> = {
  "https://example.com/post": {
    title: "Shipping on Fridays",
    text: "# Shipping on Fridays\n\nWe deploy every Friday after the standup, and never after 4pm.",
  },
};
