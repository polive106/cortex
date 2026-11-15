import { isChannel } from "eve/channels";
import { defineHook } from "eve/hooks";
import web from "../channels/eve";
import { container } from "../container";
import { webActivity } from "../lib/session-activity";

// Records each web chat session in the user's session list (ADR-0013). The list is a
// convenience: if the index is down, the chat carries on and the failure is only logged.
export default defineHook({
  events: {
    async "delivery.consumed"(event, ctx) {
      if (!isChannel(ctx.channel, web)) return;
      const activity = webActivity({
        sessionId: ctx.session.id,
        initiator: ctx.session.auth.initiator,
        parts: event.data.parts,
        now: ctx.now,
      });
      if (!activity) return;
      try {
        await container().recordSessionActivity.execute(activity);
      } catch (error) {
        console.warn("session index: couldn't record activity", {
          sessionId: ctx.session.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  },
});
