import { requireRole } from "@/lib/auth-guards";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("ADMIN");
  return children;
}
