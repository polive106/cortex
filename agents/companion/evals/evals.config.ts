import { anthropic } from "@ai-sdk/anthropic";
import { defineEvalConfig } from "eve/evals";

// Real-model behavior evals. They call the provider, so they run manually and in CI, never in hooks (ADR-0007).
// The judge is Haiku on the owner's ANTHROPIC_API_KEY: cheap, and no AI Gateway needed.
export default defineEvalConfig({
  judge: { model: anthropic.decisionModel("claude-haiku-5-5") },
  timeoutMs: 120_000,
});
