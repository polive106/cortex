import { headers } from "next/headers";
import type { ReactNode } from "react";
import { auth, isAllowedSession } from "@/lib/auth";
import { AccountControl, NotAllowed, SignIn } from "./web-chat-auth";

/** Shows `children` to an allowlisted, signed-in user (ADR-0006); no sign-in in development. */
export async function Authenticated({ children }: { readonly children: ReactNode }) {
  if (process.env.NODE_ENV === "development") return children;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <SignIn />;
  if (!isAllowedSession(session)) return <NotAllowed email={session.user.email} />;

  return (
    <>
      {children}
      <AccountControl
        email={session.user.email}
        image={session.user.image}
        name={session.user.name}
      />
    </>
  );
}
