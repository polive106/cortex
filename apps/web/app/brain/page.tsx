import { Authenticated } from "@/app/_components/authenticated";
import { CHAT_AGENT } from "@/app/chat-agent";
import { BrainGraphView } from "@/src/features/brain-graph";

// The brain graph needs a named agent; without one the chat falls back to "eve-agent".
const AGENT = CHAT_AGENT ?? "eve-agent";

export const metadata = { title: "Brain" };

export default function BrainPage() {
  return (
    <Authenticated>
      <BrainGraphView agent={AGENT} />
    </Authenticated>
  );
}
