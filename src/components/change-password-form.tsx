"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmation }),
      });
      const result = await response.json() as { error?: string; email?: string | null; role?: "ADMIN" | "EVALUATOR" };

      if (!response.ok) {
        setError(result.error || "Não foi possível atualizar a senha.");
        return;
      }

      if (!result.email || !result.role) {
        setError("A senha foi atualizada, mas não foi possível renovar sua sessão. Faça login novamente.");
        return;
      }

      const login = await signIn("credentials", { email: result.email, password: newPassword, redirect: false });
      if (login?.error) {
        setError("A senha foi atualizada, mas não foi possível renovar sua sessão. Faça login novamente.");
        return;
      }

      setSuccess("Senha atualizada. Você será redirecionado para seu painel.");
      window.setTimeout(() => {
        router.replace(result.role === "ADMIN" ? "/admin" : "/avaliador");
        router.refresh();
      }, 900);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="current-password" className="mb-2 block text-sm font-semibold text-ink">Senha atual</label>
        <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="min-h-12 w-full rounded-md border border-outline/70 bg-white px-4 text-base text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" required />
      </div>
      <div>
        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-ink">Nova senha</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="min-h-12 w-full rounded-md border border-outline/70 bg-white px-4 text-base text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" required />
        <p className="mt-1.5 text-xs text-ink-muted">Use pelo menos 8 caracteres.</p>
      </div>
      <div>
        <label htmlFor="password-confirmation" className="mb-2 block text-sm font-semibold text-ink">Confirmar nova senha</label>
        <input id="password-confirmation" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="min-h-12 w-full rounded-md border border-outline/70 bg-white px-4 text-base text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" required />
      </div>
      {error ? <p className="rounded-md bg-danger-soft/60 px-3 py-2 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
      {success ? <p className="rounded-md bg-lime/30 px-3 py-2 text-sm font-semibold text-lime-deep" role="status">{success}</p> : null}
      <Button type="submit" loading={saving} className="w-full">Atualizar senha</Button>
    </form>
  );
}
