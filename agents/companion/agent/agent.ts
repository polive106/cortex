import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

// Direct Anthropic call on the owner's ANTHROPIC_API_KEY, not AI Gateway (E2-US02).
// eve caches the system prompt automatically for Anthropic models.
export default defineAgent({
  model: anthropic("claude-sonnet-5-5"),
});
