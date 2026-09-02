"use client";

import { Bell, CircleHelp, Search, Radio } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConfiguration = pathname.includes("/configuracao");

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="fixed left-0 right-0 top-0 z-30 h-[72px] border-b border-outline/30 bg-surface/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <label className="relative hidden w-64 sm:block lg:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted/60" aria-hidden="true" />
              <span className="sr-only">Buscar ideathons</span>
              <input className="h-10 w-full rounded-full border-0 bg-surface-container pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/50" placeholder="Buscar ideathons..." />
            </label>
            <span className="flex items-center gap-2 text-xs font-semibold text-ink-muted sm:hidden"><Radio className="size-3.5 text-danger" />Painel</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="mr-2 hidden h-full items-center gap-1 lg:flex" aria-label="Seções do painel">
              <a href="/admin" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors hover:text-ink ${!isConfiguration ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted"}`}>Overview</a>
              <a href="/admin/ideathons/hackathon-sustentabilidade-2024/configuracao" className={`flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-colors hover:text-ink ${isConfiguration ? "border-lime font-bold text-ink" : "border-transparent text-ink-muted"}`}>Configuração</a>
              <a href="#analytics" className="flex h-[72px] items-center border-b-2 border-transparent px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink">Analytics</a>
              <a href="#reports" className="flex h-[72px] items-center border-b-2 border-transparent px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink">Reports</a>
            </nav>
            <button type="button" className="hidden items-center gap-2 rounded-md px-2.5 py-2 text-sm font-bold text-ink hover:bg-surface-container sm:flex"><span className="size-2 rounded-full bg-danger" />Live View</button>
            <span className="mx-1 hidden h-8 w-px bg-outline/40 sm:block" />
            <button type="button" className="relative rounded-md p-2 text-ink-muted hover:bg-surface-container hover:text-ink" aria-label="Notificações"><Bell className="size-5" /><span className="absolute right-2 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" /></button>
            <button type="button" className="hidden rounded-md p-2 text-ink-muted hover:bg-surface-container hover:text-ink sm:block" aria-label="Ajuda"><CircleHelp className="size-5" /></button>
            <span className="ml-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary-container text-xs font-bold text-lime shadow-sm">DP</span>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-[72px]">{children}</main>
    </div>
  );
}
