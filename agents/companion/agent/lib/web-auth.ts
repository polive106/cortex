import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { auth, isAllowedSession } from "../../../../apps/web/lib/auth.js";

/** A signed-in, allowlisted web chat user (ADR-0006). */
const betterAuthSession: AuthFn<Request> = async (request) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !isAllowedSession(session)) return null;

  const { email, image, name } = session.user;
  return {
    attributes: { email, name, ...(image ? { picture: image } : {}) },
    authenticator: "better-auth:vercel",
    principalId: session.user.id,
    principalType: "user",
  };
};

/** Who may call companion's web routes: the chat channel and the artifact route share it. */
export const WEB_AUTH: AuthFn<Request>[] = [betterAuthSession, vercelOidc(), localDev()];
