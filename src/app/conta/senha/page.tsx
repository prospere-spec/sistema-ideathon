import { ChangePasswordForm } from "@/components/change-password-form";
import { requireUser } from "@/lib/auth-guards";

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-black/[0.04] bg-white p-7 shadow-card sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-deep">Segurança da conta</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">Crie sua senha pessoal</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">Por segurança, troque a senha temporária antes de acessar o painel.</p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
