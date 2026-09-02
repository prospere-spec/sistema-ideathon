import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { requireRole } from "@/lib/auth-guards";

export default async function EvaluatorHomePage() {
  const user = await requireRole("EVALUATOR");

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-container">
        <section className="rounded-lg border border-black/[0.04] bg-white p-8 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-deep">Área do avaliador</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">Olá, {user.name}</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-ink-muted">
            Suas salas e ideias atribuídas aparecerão aqui quando o próximo fluxo de avaliação for conectado ao banco.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <SignOutButton />
            <Link href="/login" className="text-sm font-bold text-lime-deep hover:text-ink">Login</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
