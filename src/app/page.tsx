import { redirect } from "next/navigation";
import { getAuthenticatedDestination } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function Home() {
  redirect(await getAuthenticatedDestination() ?? "/login");
}
