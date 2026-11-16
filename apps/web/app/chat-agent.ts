import { WEB_CHAT_AGENT } from "./eve-agent";

// E2E points the UI at the mockModel double. eve's installer rewrites eve-agent.ts, so the
// override lives here, shared by every screen that talks to the agent.
export const CHAT_AGENT: string | undefined =
  process.env.NEXT_PUBLIC_WEB_CHAT_AGENT ?? WEB_CHAT_AGENT;
