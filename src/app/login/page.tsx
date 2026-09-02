"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Rocket, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Insira seu e-mail e sua senha para continuar.");
      return;
    }

    setError("");
    router.push("/admin");
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(480px,1fr)_minmax(520px,1fr)]">
      <section className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-[8.5vw]" aria-labelledby="login-title">
        <a href="/login" className="inline-flex w-fit items-center gap-3 text-2xl font-bold tracking-[-0.05em] text-ink" aria-label="Revvolução, página inicial">
          <span className="flex size-8 items-center justify-center text-lime-deep"><Zap className="size-8 fill-current" strokeWidth={2.5} /></span>
          <span>Revvolução</span>
        </a>

        <div className="flex flex-1 items-center py-16 lg:py-12">
          <div className="w-full max-w-[525px]">
            <div className="mb-9">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lime-deep">Ideathon Management</p>
              <h1 id="login-title" className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-[40px] sm:leading-[1.12]">Bem-vindo de volta</h1>
              <p className="mt-3 text-base leading-7 text-ink-muted">Insira suas credenciais para acessar o painel de gestão.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted/70" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setError(""); }}
                      placeholder="nome@empresa.com"
                      className={`min-h-14 w-full rounded-md border bg-surface-low pl-12 pr-4 text-base text-ink placeholder:text-ink-muted/60 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40 ${error ? "border-danger" : "border-outline/70 focus:border-lime"}`}
                      aria-invalid={Boolean(error)}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label htmlFor="password" className="block text-sm font-semibold text-ink">Senha</label>
                    <a href="mailto:admin@revvolucao.com?subject=Recuperação de senha" className="text-sm font-semibold text-lime-deep transition-colors hover:text-ink">Esqueci minha senha</a>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted/70" aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => { setPassword(event.target.value); setError(""); }}
                      placeholder="••••••••"
                      className={`min-h-14 w-full rounded-md border bg-surface-low pl-12 pr-12 text-base tracking-[0.08em] text-ink placeholder:text-ink-muted/60 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40 ${error ? "border-danger" : "border-outline/70 focus:border-lime"}`}
                      aria-invalid={Boolean(error)}
                    />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-container hover:text-ink" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="mt-6 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-5 rounded border-outline bg-white text-primary accent-primary focus:ring-2 focus:ring-lime/50" />
                <span>Lembrar-me neste dispositivo</span>
              </label>

              {error ? <p className="mt-4 rounded-md bg-danger-soft/60 px-3 py-2 text-sm font-semibold text-danger" role="alert">{error}</p> : null}

              <button type="submit" className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-lime px-5 text-base font-bold text-lime-foreground shadow-[0_10px_25px_rgba(212,255,111,0.25)] transition-all hover:-translate-y-0.5 hover:bg-lime/85 hover:shadow-[0_14px_30px_rgba(212,255,111,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2">
                Entrar no Dashboard
                <ArrowRight className="size-5" />
              </button>
            </form>

            <div className="mt-14 border-t border-outline/40 pt-6 text-center text-sm text-ink-muted">
              Não tem uma conta? <a href="mailto:admin@revvolucao.com?subject=Solicitação de acesso" className="font-bold text-ink underline decoration-lime-deep decoration-2 underline-offset-4 transition-colors hover:text-lime-deep">Fale com o administrador</a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-primary lg:block" aria-label="Sobre a plataforma">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(212,255,111,0.18),transparent_27%),radial-gradient(circle_at_90%_70%,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,#111217_0%,#050506_65%,#20231d_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(135deg,black,transparent_70%)]" />

        <div className="absolute left-[14%] top-[14%] h-[62%] w-[78%] rotate-[-4deg] rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl blur-[1px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-lime" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Overview</span></div>
            <div className="flex gap-2"><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/20" /></div>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {["12", "843", "48"].map((value, index) => <div key={value} className="rounded-lg border border-white/10 bg-white/[0.045] p-4"><span className="block text-[9px] uppercase tracking-[0.15em] text-white/45">{["Eventos", "Ideias", "Avaliadores"][index]}</span><span className="mt-4 block text-3xl font-bold text-white/80">{value}</span></div>)}
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-6 flex items-center justify-between"><span className="text-sm font-bold text-white/75">Visão geral de ideathons</span><span className="h-2 w-16 rounded-full bg-lime/60" /></div>
            <div className="space-y-4">{[82, 64, 38, 22].map((width, index) => <div key={width} className="flex items-center gap-3"><span className="h-2 w-20 rounded-full bg-white/10" /><span className="h-2 flex-1 rounded-full bg-white/10"><span className="block h-full rounded-full bg-indigo/70" style={{ width: `${width}%` }} /></span><span className="h-2 w-8 rounded-full bg-white/10" /></div>)}</div>
          </div>
        </div>

        <div className="absolute -left-16 top-[35%] h-52 w-[120%] rotate-[-19deg] border-y border-white/[0.06] bg-gradient-to-r from-transparent via-lime/[0.07] to-transparent" />
        <div className="absolute -right-20 bottom-[23%] h-44 w-[90%] rotate-[15deg] border-y border-indigo/[0.18] bg-gradient-to-r from-transparent via-indigo/[0.08] to-transparent" />

        <div className="absolute bottom-12 left-10 right-10 rounded-xl border border-white/20 bg-white/[0.1] p-6 shadow-2xl backdrop-blur-xl xl:bottom-16 xl:left-20 xl:right-20">
          <div className="mb-4 flex items-center gap-3 text-lime"><Rocket className="size-6" /><span className="text-sm font-bold uppercase tracking-[0.12em]">Ideathon Management</span></div>
          <h2 className="max-w-lg text-2xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-3xl">Acelerando a Inovação Estruturada.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">A plataforma definitiva para gerenciar equipes, avaliar ideias e transformar conceitos de alto impacto em realidade. Organização rigorosa encontra velocidade de execução.</p>
        </div>
      </section>
    </main>
  );
}
