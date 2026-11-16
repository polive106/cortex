import { AgentChat } from "./agent-chat";
import { Authenticated } from "./authenticated";

export function AuthenticatedAgentChat({
  sessionId,
  sessionless,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  return (
    <Authenticated>
      <AgentChat sessionId={sessionId} sessionless={sessionless} />
    </Authenticated>
  );
}
