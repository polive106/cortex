import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import { auth, isAllowedSession } from "../../../../apps/web/lib/auth.js";

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

export default eveChannel({
  auth: [betterAuthSession, vercelOidc(), localDev()],
});
