import { headers } from "next/headers";
import { auth, isAllowedSession } from "@/lib/auth";
import { AgentChat } from "./agent-chat";
import { AccountControl, NotAllowed, SignIn } from "./web-chat-auth";

export async function AuthenticatedAgentChat({
  sessionId,
  sessionless,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  if (process.env.NODE_ENV === "development") {
    return <AgentChat sessionId={sessionId} sessionless={sessionless} />;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <SignIn />;
  if (!isAllowedSession(session)) return <NotAllowed email={session.user.email} />;

  return (
    <>
      <AgentChat sessionId={sessionId} sessionless={sessionless} />
      <AccountControl
        email={session.user.email}
        image={session.user.image}
        name={session.user.name}
      />
    </>
  );
}
