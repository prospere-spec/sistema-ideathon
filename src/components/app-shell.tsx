"use client";

import { Bell, CircleHelp, LogOut, Search, Radio, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type AppSection = "overview" | "configuration" | "analytics" | "reports" | "dashboard" | "ideathons" | "users" | "settings";
type AppNavigation = "panel" | "management" | "evaluator";

export function AppShell({ children, activeSection, navigation = "panel", headerAction, darkHeader = false }: { children: React.ReactNode; activeSection?: AppSection; navigation?: AppNavigation; headerAction?: React.ReactNode; darkHeader?: boolean }) {
  const pathname = usePathname();
  const currentSection = activeSection || (pathname.includes("/configuracao") ? "configuration" : "overview");
  const homeHref = navigation === "evaluator" ? "/avaliador" : "/admin";

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className={`fixed left-0 right-0 top-0 z-30 h-[72px] border-b backdrop-blur-md ${darkHeader ? "border-white/10 bg-black/95 text-white" : "border-outline/30 bg-surface/90"}`}>
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={homeHref} className={`hidden shrink-0 items-center gap-2 text-[22px] font-bold tracking-[-0.06em] md:flex ${darkHeader ? "text-lime-deep" : "text-ink"}`} aria-label="Revvolução, painel administrativo">
              <Zap className="size-5 fill-lime-deep text-lime-deep" strokeWidth={2.5} />
              Revvolução
            </Link>
            <label className="relative hidden w-64 sm:block lg:w-72">
              <Search className={`absolute left-3 top-1/2 size-4 -translate-y-1/2 ${darkHeader ? "text-white/60" : "text-ink-muted/60"}`} aria-hidden="true" />
              <span className="sr-only">Buscar ideathons</span>
              <input className={`h-10 w-full rounded-full border-0 pl-10 pr-4 text-sm placeholder:transition-colors focus:outline-none focus:ring-2 focus:ring-lime/50 ${darkHeader ? "bg-white/[0.06] text-white placeholder:text-white/60 focus:bg-white/10" : "bg-surface-container text-ink placeholder:text-ink-muted/60 focus:bg-white"}`} placeholder="Buscar ideathons..." />
            </label>
            <span className={`flex items-center gap-2 text-xs font-semibold sm:hidden ${darkHeader ? "text-white/70" : "text-ink-muted"}`}><Radio className="size-3.5 text-danger" />Painel</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="mr-2 hidden h-full items-center gap-1 lg:flex" aria-label={navigation === "management" ? "Navegação administrativa" : "Seções do painel"}>
              {navigation === "evaluator" ? <Link href="/avaliador" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "ideathons" ? "border-lime font-bold text-lime-deep" : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>Minhas avaliações</Link> : navigation === "management" ? <>
                <Link href="/admin" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "dashboard" ? "border-lime font-bold text-lime-deep" : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>Dashboard</Link>
                <Link href="/admin/ideathons" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "ideathons" ? "border-lime font-bold text-lime-deep" : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>Ideathons</Link>
                <Link href="/admin/usuarios" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "users" ? "border-lime font-bold text-lime-deep" : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>Users</Link>
                <a href="#settings" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "settings" ? "border-lime font-bold text-lime-deep" : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>Settings</a>
              </> : <>
                <Link href="/admin" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "overview" ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>Overview</Link>
                <Link href="/admin/ideathons" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "configuration" ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>Configuração</Link>
                <a href="#analytics" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "analytics" ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>Analytics</a>
                <Link href="/admin/ideathons" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === "reports" ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>Reports</Link>
              </>}
            </nav>
            {headerAction ? <div className="mr-1 hidden sm:block">{headerAction}</div> : null}
            <button type="button" className={`hidden items-center gap-2 rounded-md px-2.5 py-2 text-sm font-bold sm:flex ${darkHeader ? "text-white hover:bg-white/10" : "text-ink hover:bg-surface-container"}`}><span className="size-2 rounded-full bg-danger" />Live View</button>
            <span className={`mx-1 hidden h-8 w-px sm:block ${darkHeader ? "bg-white/15" : "bg-outline/40"}`} />
            <button type="button" className={`relative rounded-md p-2 hover:text-ink ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container"}`} aria-label="Notificações"><Bell className="size-5" /><span className={`absolute right-2 top-1.5 size-2 rounded-full bg-danger ring-2 ${darkHeader ? "ring-black" : "ring-surface"}`} /></button>
            <button type="button" className={`hidden rounded-md p-2 sm:block ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label="Ajuda"><CircleHelp className="size-5" /></button>
            <button type="button" className={`hidden rounded-md p-2 sm:block ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label="Configurações da conta"><Settings className="size-5" /></button>
             <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="group ml-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary-container text-xs font-bold text-lime shadow-sm" aria-label="Sair da conta" title="Sair">
               <span className="group-hover:hidden">DP</span>
               <LogOut className="hidden size-4 group-hover:block" />
             </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-[72px]">{children}</main>
    </div>
  );
}
