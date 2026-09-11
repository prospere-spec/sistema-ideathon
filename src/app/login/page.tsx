import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedDestination } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const destination = await getAuthenticatedDestination();
  if (destination) redirect(destination);

  return <LoginForm />;
}
