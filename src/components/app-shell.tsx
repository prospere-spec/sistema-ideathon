"use client";

import { Bell, CircleHelp, LogOut, Menu, Radio, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

type AppSection = "overview" | "configuration" | "analytics" | "reports" | "dashboard" | "ideathons" | "users" | "settings";
type AppNavigation = "panel" | "management" | "evaluator";

const managementLinks = [
  { href: "/admin", label: "Visão geral", section: "dashboard" as const },
  { href: "/admin/ideathons", label: "Ideathons", section: "ideathons" as const },
  { href: "/admin/usuarios", label: "Usuários", section: "users" as const },
  { href: "/conta/senha", label: "Conta", section: "settings" as const },
];

export function AppShell({ children, activeSection, navigation = "panel" }: { children: React.ReactNode; activeSection?: AppSection; navigation?: AppNavigation; headerAction?: React.ReactNode; darkHeader?: boolean }) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const darkHeader = false;
  const currentSection = activeSection || (pathname.includes("/configuracao") ? "configuration" : "overview");
  const homeHref = navigation === "evaluator" ? "/avaliador" : "/admin";
  const links = navigation === "evaluator" ? [{ href: "/avaliador", label: "Minhas avaliações", section: "ideathons" as const }] : managementLinks;
  const ideathonId = navigation === "management" ? pathname.match(/^\/admin\/ideathons\/([^/]+)/)?.[1] : undefined;
  const contextLinks = ideathonId ? [
    { href: `/admin/ideathons/${ideathonId}`, label: "Resumo" },
    { href: `/admin/ideathons/${ideathonId}/fases`, label: "Fases" },
    { href: `/admin/ideathons/${ideathonId}/projetos`, label: "Ideias" },
    { href: `/admin/ideathons/${ideathonId}/salas`, label: "Salas" },
    { href: `/admin/ideathons/${ideathonId}/avaliadores`, label: "Avaliadores" },
    { href: `/admin/ideathons/${ideathonId}/resultados`, label: "Resultados" },
    { href: `/admin/ideathons/${ideathonId}/auditoria`, label: "Auditoria" },
  ] : [];
  const notificationHref = navigation === "evaluator" ? "/avaliador" : "/admin";
  const notificationCopy = navigation === "evaluator" ? "Você tem avaliações pendentes para concluir." : "Você tem avaliações pendentes para acompanhar.";
  const handleLogout = () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") document.cookie = "ideathon-demo-role=; Max-Age=0; Path=/";
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className={`fixed left-0 right-0 top-0 z-30 h-[72px] border-b backdrop-blur-md ${darkHeader ? "border-white/10 bg-black/95 text-white" : "border-outline/30 bg-surface/90"}`}>
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={homeHref} className="relative hidden h-8 w-32 shrink-0 overflow-hidden md:block" aria-label="Revvolução, página inicial"><img src="/brand/logo-revvolucao.png" alt="Revvolução" className="absolute left-0 top-1/2 h-[72px] max-w-none -translate-y-1/2" /></Link>
            {navigation !== "evaluator" ? <form action="/admin/ideathons" method="get" className="relative hidden sm:block"><Search className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${darkHeader ? "text-white/60" : "text-ink-muted/60"}`} aria-hidden="true" /><label htmlFor="global-search" className="sr-only">Buscar ideathons</label><input id="global-search" name="q" className="h-10 w-64 rounded-full border-0 bg-surface-container pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/50 lg:w-72" placeholder="Buscar ideathons..." /></form> : null}
            <span className={`flex items-center gap-2 text-xs font-semibold sm:hidden ${darkHeader ? "text-white/70" : "text-ink-muted"}`}><Radio className="size-3.5 text-danger" />{navigation === "evaluator" ? "Avaliações" : "Painel"}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="mr-2 hidden h-full items-center gap-1 lg:flex" aria-label="Navegação principal">{links.map((link) => <Link key={link.href} href={link.href} className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors ${currentSection === link.section ? `border-lime font-bold ${darkHeader ? "text-lime" : "text-ink"}` : `border-transparent ${darkHeader ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"}`}`}>{link.label}</Link>)}</nav>
            <span className={`mx-1 hidden h-8 w-px sm:block ${darkHeader ? "bg-white/15" : "bg-outline/40"}`} />
            <button type="button" onClick={() => setMobileNavOpen((open) => !open)} className={`rounded-md p-2 lg:hidden ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label={mobileNavOpen ? "Fechar navegação" : "Abrir navegação"} aria-expanded={mobileNavOpen} aria-controls="mobile-navigation">{mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
            <div className="relative"><button type="button" onClick={() => setNotificationsOpen((open) => !open)} className={`relative rounded-md p-2 ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label="Notificações" aria-expanded={notificationsOpen} aria-controls="notifications-popover"><Bell className="size-5" /><span className={`absolute right-2 top-1.5 size-2 rounded-full bg-danger ring-2 ${darkHeader ? "ring-black" : "ring-surface"}`} /></button>{notificationsOpen ? <div id="notifications-popover" role="status" className="absolute right-0 top-12 w-72 rounded-lg border border-outline/40 bg-white p-4 text-ink shadow-popover"><p className="text-sm font-bold">Notificações</p><p className="mt-2 text-xs leading-5 text-ink-muted">{notificationCopy}</p><Link href={notificationHref} onClick={() => setNotificationsOpen(false)} className="mt-3 inline-flex text-xs font-bold text-lime-deep hover:underline">Abrir {navigation === "evaluator" ? "avaliações" : "dashboard"}</Link></div> : null}</div>
            <a href="mailto:admin@revvolucao.com" className={`hidden rounded-md p-2 sm:block ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label="Ajuda"><CircleHelp className="size-5" /></a>
            <Link href="/conta/senha" className={`hidden rounded-md p-2 sm:block ${darkHeader ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-muted hover:bg-surface-container hover:text-ink"}`} aria-label="Configurações da conta"><Settings className="size-5" /></Link>
            <button type="button" onClick={handleLogout} className="group ml-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary-container text-xs font-bold text-lime shadow-sm" aria-label="Sair da conta" title="Sair"><span className="group-hover:hidden">DP</span><LogOut className="hidden size-4 group-hover:block" /></button>
          </div>
        </div>
      </header>
      {mobileNavOpen ? <nav id="mobile-navigation" className={`fixed left-0 right-0 top-[72px] z-20 border-b p-3 shadow-popover lg:hidden ${darkHeader ? "border-white/10 bg-primary text-white" : "border-outline/30 bg-white text-ink"}`} aria-label="Navegação principal mobile">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileNavOpen(false)} className={`block rounded-md px-4 py-3 text-sm font-semibold ${currentSection === link.section ? (darkHeader ? "bg-white/10 text-lime" : "bg-lime/20 text-ink") : darkHeader ? "text-white/80 hover:bg-white/10" : "text-ink-muted hover:bg-surface-low hover:text-ink"}`}>{link.label}</Link>)}</nav> : null}
      {contextLinks.length ? <nav className="fixed left-0 right-0 top-[72px] z-10 overflow-x-auto border-b border-outline/30 bg-white/95 backdrop-blur-md" aria-label="Navegação do ideathon"><div className="mx-auto flex min-w-max max-w-container px-4 sm:px-6 lg:px-8">{contextLinks.map((link) => <Link key={link.href} href={link.href} className={`border-b-2 px-4 py-3 text-xs font-bold transition-colors ${pathname === link.href ? "border-lime text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>{link.label}</Link>)}</div></nav> : null}
      <main className={`min-h-screen ${contextLinks.length ? "pt-[120px]" : "pt-[72px]"}`}>{children}</main>
    </div>
  );
}
