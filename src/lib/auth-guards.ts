import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { demoRoleCookie, getDemoUser, isDemoMode } from "@/lib/demo-mode";

type AppRole = "ADMIN" | "EVALUATOR";

// Entry pages must check for an existing session without requiring a login.
// In demo mode, only an explicit role cookie counts as an existing session.
export async function getAuthenticatedDestination() {
  if (isDemoMode) {
    const role = (await cookies()).get(demoRoleCookie)?.value;
    if (role === "ADMIN") return "/admin";
    if (role === "EVALUATOR") return "/avaliador";
    return null;
  }

  const session = await auth();
  const user = session?.user;
  if (!user || user.status !== "ACTIVE") return null;
  if (user.role !== "ADMIN" && user.role !== "EVALUATOR") return null;
  if (user.mustChangePassword) return "/conta/senha";
  return user.role === "ADMIN" ? "/admin" : "/avaliador";
}

export async function requireUser(options: { allowPasswordChange?: boolean } = {}) {
  if (isDemoMode) return getDemoUser((await cookies()).get(demoRoleCookie)?.value);
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  if (session.user.mustChangePassword && !options.allowPasswordChange) {
    redirect("/conta/senha");
  }

  return session.user;
}

export async function requireRole(role: AppRole) {
  const user = await requireUser();

  if (user.role !== role) {
    redirect(role === "ADMIN" ? "/avaliador" : "/admin");
  }

  return user;
}
