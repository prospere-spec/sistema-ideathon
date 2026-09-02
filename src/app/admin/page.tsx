import { CalendarDays, ClipboardCheck, Download, Lightbulb, MoreHorizontal, Rocket, UserRound, AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ideathons, reviewers, submissionBars, type IdeathonRow } from "@/lib/dashboard-fixtures";

const columns: DataColumn<IdeathonRow>[] = [
  {
    key: "event",
    header: "Nome do evento",
    className: "min-w-[260px]",
    render: (row) => <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-high text-sm font-bold text-ink">{row.initial}</span><div><p className="font-semibold text-ink group-hover:text-indigo-deep">{row.name}</p><p className="mt-0.5 text-xs text-ink-muted">{row.note}</p></div></div>,
  },
  { key: "progress", header: "Progresso", className: "w-40", render: (row) => <ProgressBar value={row.progress} /> },
  { key: "ideas", header: "Ideias", className: "w-20", render: (row) => <span className="font-semibold">{row.ideas ?? "--"}</span> },
  { key: "status", header: "Status", render: (row) => <Badge tone={row.tone}>{row.status}</Badge> },
  { key: "action", header: "", className: "text-right", render: () => <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink">Ver detalhes <ArrowRight className="size-3.5" /></button> },
];

export default function AdminDashboard() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-deep">Centro de comando <span className="mx-1 text-outline">/</span> Hoje</p>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">Admin Dashboard <span className="text-2xl sm:text-3xl">👋</span></h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">Visão geral do gerenciamento de ideathons e métricas de desempenho.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary"><CalendarDays className="size-4" />Esta semana</Button>
            <Button variant="primary"><Download className="size-4" />Exportar</Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas principais">
          <MetricCard label="Ideathons ativos" value="12" trend="+2" helper="vs. último mês" icon={Rocket} tone="lime" />
          <MetricCard label="Total de ideias" value="843" trend="+15%" helper="vs. último mês" icon={Lightbulb} tone="indigo" />
          <MetricCard label="Avaliadores online" value="48" icon={UserRound} tone="neutral" detail={<span className="inline-flex items-center gap-1.5 rounded-md bg-surface-high px-1.5 py-1 text-ink-muted"><span className="size-1.5 animate-pulse rounded-full bg-lime-deep" />Ativos agora</span>} />
          <MetricCard label="Avaliações pendentes" value="156" icon={ClipboardCheck} tone="danger" detail={<span className="inline-flex items-center gap-1 rounded-md bg-danger-soft/70 px-1.5 py-1 text-danger"><AlertTriangle className="size-3.5" />Atenção necessária</span>} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <article className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card xl:col-span-8">
            <div className="flex items-center justify-between border-b border-outline/30 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-bold tracking-[-0.025em] text-ink">Visão geral de ideathons</h2><p className="mt-1 text-xs text-ink-muted">Acompanhe os eventos em andamento</p></div><button type="button" className="rounded-md p-2 text-ink-muted hover:bg-surface-low hover:text-ink" aria-label="Mais opções"><MoreHorizontal className="size-5" /></button></div>
            <DataTable columns={columns} rows={ideathons} />
            <div className="border-t border-outline/30 px-5 py-4 text-center sm:px-6"><button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-indigo-deep">Ver todos os eventos <ArrowRight className="size-3.5" /></button></div>
          </article>

          <div className="space-y-4 xl:col-span-4">
            <article className="relative overflow-hidden rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-lime/30 blur-3xl" />
              <div className="relative"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-ink-muted">Ideias submetidas</p><p className="mt-3 text-5xl font-bold leading-none tracking-[-0.06em] text-ink">328</p></div><span className="rounded-full bg-lime/25 px-2 py-1 text-xs font-bold text-lime-deep">+12%</span></div><p className="mt-2 text-xs text-ink-muted">em relação à semana anterior</p><div className="mt-8 flex h-28 items-end gap-2 border-b border-outline/40 pb-0">{submissionBars.map((bar, index) => <div key={`${bar.day}-${index}`} className="group relative flex h-full flex-1 items-end"><div className={`w-full rounded-t-sm transition-opacity group-hover:opacity-75 ${bar.highlight ? "bg-lime" : "bg-surface-high"}`} style={{ height: `${bar.value}%` }}><span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white group-hover:block">{bar.value} ideias</span></div></div>)}</div><div className="mt-2 flex justify-between text-[10px] font-semibold text-ink-muted/70">{submissionBars.map((bar, index) => <span key={`${bar.day}-label-${index}`}>{bar.day}</span>)}</div></div>
            </article>

            <article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Top avaliadores</h2><p className="mt-1 text-xs text-ink-muted">Avaliações concluídas</p></div><button type="button" className="rounded-md p-2 text-ink-muted hover:bg-surface-low hover:text-ink" aria-label="Mais opções"><MoreHorizontal className="size-5" /></button></div><div className="space-y-4">{reviewers.map((reviewer, index) => <div key={reviewer.name} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-primary text-lime" : "bg-surface-high text-ink-muted"}`}>{reviewer.initials}</span><div className="min-w-0"><p className="truncate text-xs font-bold text-ink">{reviewer.name}</p><p className="truncate text-[11px] text-ink-muted">{reviewer.event}</p></div></div><span className="shrink-0 text-xs font-bold text-ink">{reviewer.count} <span className="font-medium text-ink-muted">av.</span></span></div>)}</div></article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
