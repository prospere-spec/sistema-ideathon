import { requireRole } from "@/lib/auth-guards";

export default async function EvaluatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("EVALUATOR");
  return children;
}
