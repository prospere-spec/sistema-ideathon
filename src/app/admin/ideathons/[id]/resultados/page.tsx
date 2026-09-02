"use client";

import { useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Download, Filter, Lightbulb, Search, Timer, Users, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

type ProjectStatus = "complete" | "progress";

type RankedProject = {
  id: string;
  rank: number;
  name: string;
  team: string;
  status: ProjectStatus;
  innovation: number;
  impact: number;
  finalScore: number;
  partial?: boolean;
};

const projects: RankedProject[] = [
  { id: "paystream-ai", rank: 1, name: "PayStream AI", team: "Equipe Alpha", status: "complete", innovation: 9.5, impact: 9.2, finalScore: 9.35 },
  { id: "ecoinvest", rank: 2, name: "EcoInvest", team: "Green Finance", status: "complete", innovation: 8.8, impact: 9.5, finalScore: 9.15 },
  { id: "blockledger", rank: 3, name: "BlockLedger", team: "Chain React", status: "progress", innovation: 9.0, impact: 8.9, finalScore: 8.95, partial: true },
  { id: "microlend", rank: 4, name: "MicroLend", team: "Social Capital", status: "complete", innovation: 8.5, impact: 8.7, finalScore: 8.6 },
  { id: "smartwallet", rank: 5, name: "SmartWallet", team: "Tech Savvy", status: "progress", innovation: 8.2, impact: 8.5, finalScore: 8.35, partial: true },
];

function StatCard({ label, value, suffix, icon: Icon, tone, children }: { label: string; value: string; suffix?: string; icon: LucideIcon; tone: "lime" | "indigo" | "neutral" | "danger"; children?: React.ReactNode }) {
  const iconTone = { lime: "bg-lime/30 text-lime-deep", indigo: "bg-indigo/10 text-indigo-deep", neutral: "bg-surface-high text-ink", danger: "bg-danger-soft text-danger" }[tone];
  return (
    <article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink-muted">{label}</h2>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${iconTone}`}><Icon className="size-5" /></span>
      </div>
      <div className="mt-7 flex items-baseline gap-2">
        <span className="text-[2.5rem] font-bold leading-none tracking-[-0.06em] text-ink">{value}</span>
        {suffix ? <span className="text-sm font-medium text-ink">{suffix}</span> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

function RankMark({ rank }: { rank: number }) {
  const tone = rank === 1 ? "bg-lime-deep text-white" : rank === 2 ? "bg-surface-high text-ink" : rank === 3 ? "bg-surface-container text-ink" : "bg-surface-low text-ink";
  return <span className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${tone}`}>{rank}</span>;
}

function StatusIcon({ status }: { status: ProjectStatus }) {
  return status === "complete"
    ? <CheckCircle2 className="size-6 text-emerald-500" aria-label="Avaliação completa" />
    : <Clock3 className="size-6 text-amber-500" aria-label="Avaliação em progresso" />;
}

export default function RankingPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [search, setSearch] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  const visibleProjects = projects.filter((project) => {
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || `${project.name} ${project.team}`.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  function handleExport() {
    setExportNotice("Exportação preparada para download.");
  }

  return (
    <AppShell activeSection="reports">
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Ranking em Tempo Real</h1>
            <p className="mt-2 flex items-center gap-2 text-base text-ink-muted"><span className="size-2.5 rounded-full bg-emerald-500" />Ideathon Fintech 2024 - Atualizado agora</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors ${filtersOpen ? "border-ink bg-surface-low" : "border-outline bg-white hover:bg-surface-low"}`} aria-expanded={filtersOpen}><Filter className="size-4" />Filtros</button>
            <button type="button" onClick={handleExport} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold transition-colors hover:bg-surface-low"><Download className="size-4" />Exportar</button>
          </div>
        </section>

        {filtersOpen ? <section className="flex flex-col gap-3 rounded-lg border border-black/[0.04] bg-white p-4 shadow-card sm:flex-row sm:items-end" aria-label="Filtros do ranking">
          <label className="flex-1 text-xs font-bold text-ink-muted">Buscar projeto ou equipe<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex: PayStream" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink placeholder:text-ink-muted/60 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" /></label>
          <label className="w-full text-xs font-bold text-ink-muted sm:w-56">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ProjectStatus)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="all">Todos os status</option><option value="complete">Avaliação completa</option><option value="progress">Em progresso</option></select></label>
        </section> : null}

        {exportNotice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{exportNotice}</p> : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do ideathon">
          <StatCard label="Projetos Ativos" value="24" suffix="/30" icon={Lightbulb} tone="neutral" />
          <StatCard label="Média Global" value="8.4" icon={BarChart3} tone="lime"><span className="inline-flex rounded-full bg-lime/30 px-2 py-1 text-xs font-semibold text-lime-deep">+0.2h</span></StatCard>
          <StatCard label="Jurados Concluídos" value="85%" icon={Users} tone="indigo"><ProgressBar value={85} showLabel={false} /></StatCard>
          <StatCard label="Tempo Restante" value="02:15" suffix="hrs" icon={Timer} tone="danger" />
        </section>

        <section className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card" aria-labelledby="ranking-title">
          <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><h2 id="ranking-title" className="text-2xl font-medium tracking-[-0.04em] text-ink">Classificação Geral</h2><p className="mt-1 text-sm text-ink-muted">Acompanhe a posição dos projetos conforme as avaliações são concluídas.</p></div>
            <div className="flex flex-wrap gap-2"><Badge tone="lime"><CheckCircle2 className="size-3.5" />Avaliação Completa</Badge><Badge tone="amber"><Clock3 className="size-3.5" />Em Progresso</Badge></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead><tr className="bg-surface-low/60"><th className="px-5 py-4 text-xs font-semibold text-ink-muted sm:px-7">Rank</th><th className="px-5 py-4 text-xs font-semibold text-ink-muted">Nome da Ideia</th><th className="px-5 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Média Inovação</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Média Impacto</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted sm:px-7">Nota Final</th></tr></thead>
              <tbody className="divide-y divide-outline/30">
                {visibleProjects.map((project) => <tr key={project.id} className="transition-colors hover:bg-surface-low/50">
                  <td className="px-5 py-4 sm:px-7"><RankMark rank={project.rank} /></td>
                  <td className="px-5 py-4"><p className="font-bold text-ink">{project.name}</p><p className="mt-0.5 text-xs text-ink-muted">{project.team}</p></td>
                  <td className="px-5 py-4"><StatusIcon status={project.status} /><span className="sr-only">{project.status === "complete" ? "Avaliação completa" : "Em progresso"}</span></td>
                  <td className={`px-5 py-4 text-right text-sm ${project.partial ? "text-ink" : "text-ink"}`}>{project.innovation.toFixed(1)}{project.partial ? "*" : ""}</td>
                  <td className="px-5 py-4 text-right text-sm">{project.impact.toFixed(1)}{project.partial ? "*" : ""}</td>
                  <td className="px-5 py-4 text-right sm:px-7"><span className={`inline-flex rounded-md px-3 py-2 text-base font-bold ${project.rank === 1 ? "bg-lime text-ink" : "bg-surface-container text-ink"}`}>{project.finalScore.toFixed(2)}{project.partial ? "*" : ""}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {!visibleProjects.length ? <div className="px-6 py-12 text-center"><Search className="mx-auto size-7 text-ink-muted" /><p className="mt-3 text-sm font-semibold text-ink">Nenhum projeto encontrado</p><p className="mt-1 text-xs text-ink-muted">Ajuste os filtros para ver outros resultados.</p></div> : null}
          <div className="border-t border-outline/30 bg-surface-low/40 px-5 py-4 text-center text-sm text-ink-muted sm:px-7">* Notas parciais sujeitas à alteração.</div>
        </section>
      </div>
    </AppShell>
  );
}
