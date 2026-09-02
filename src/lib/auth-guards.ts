import { redirect } from "next/navigation";
import { auth } from "@/auth";

type AppRole = "ADMIN" | "EVALUATOR";

export async function requireUser(options: { allowPasswordChange?: boolean } = {}) {
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
