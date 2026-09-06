import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { demoRoleCookie, getDemoUser, isDemoMode } from "@/lib/demo-mode";

type ApiAuthResult =
  | { user: Session["user"]; response: null }
  | { user: null; response: NextResponse };

export async function requireAdminApi(): Promise<ApiAuthResult> {
  if (isDemoMode) return { user: getDemoUser((await cookies()).get(demoRoleCookie)?.value), response: null };
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    return { user: null, response: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 }) };
  }

  return { user: session.user, response: null };
}

export async function requireEvaluatorApi(): Promise<ApiAuthResult> {
  if (isDemoMode) return { user: getDemoUser((await cookies()).get(demoRoleCookie)?.value), response: null };
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    return { user: null, response: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  if (session.user.role !== "EVALUATOR") {
    return { user: null, response: NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 }) };
  }

  return { user: session.user, response: null };
}
