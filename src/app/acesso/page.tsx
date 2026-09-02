import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";

export default async function AccessRedirectPage() {
  const user = await requireUser();
  redirect(user.role === "ADMIN" ? "/admin" : "/avaliador");
}
