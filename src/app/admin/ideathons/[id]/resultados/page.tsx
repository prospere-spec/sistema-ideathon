"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Download, Filter, LoaderCircle, Search, Wifi, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

type RankingState = "PENDING" | "PARTIAL" | "COMPLETE";
type RankingRow = { ideaId: string; ideaName: string; teamName: string; category: string | null; finalScore: number | null; expectedEvaluations: number; receivedEvaluations: number; completionPercent: number; state: RankingState; rank: number | null; criterionAverages: Array<{ criterionId: string; criterionName: string; average: number }>; lastUpdatedAt: string | null };
type Phase = { id: string; name: string; position: number; status: string };
type Summary = { totalIdeas: number; expectedEvaluations: number; receivedEvaluations: number; completionPercent: number; averageScore: number | null; updatedAt: string | null };

const stateLabel: Record<RankingState, string> = { PENDING: "Pendente", PARTIAL: "Em progresso", COMPLETE: "Completa" };

export default function RankingPage() {
  const params = useParams<{ id: string }>();
  const ideathonId = String(params.id);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phaseId, setPhaseId] = useState("");
  const [phaseName, setPhaseName] = useState("Ranking do ideathon");
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RankingState>("ALL");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [connection, setConnection] = useState<"connected" | "offline" | "reconnecting">("reconnecting");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!navigator.onLine) {
        if (active) setConnection("offline");
        return;
      }
      if (active) setConnection((current) => current === "connected" ? current : "reconnecting");
      try {
        const query = phaseId ? `?phaseId=${encodeURIComponent(phaseId)}` : "";
        const response = await fetch(`/api/admin/ideathons/${ideathonId}/results${query}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o ranking.");
        if (!active) return;
        setPhases(payload.phases);
        setPhaseId((current: string) => current || payload.phase.id);
        setPhaseName(payload.phase.name);
        setRows(payload.data);
        setSummary(payload.summary);
        setNotice("");
        setConnection("connected");
      } catch (error) {
        if (!active) return;
        setConnection(navigator.onLine ? "reconnecting" : "offline");
        setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o ranking.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    const onOnline = () => void refresh();
    const onOffline = () => setConnection("offline");
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ideathonId, phaseId]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleRows = rows.filter((row) => {
    const matchesStatus = statusFilter === "ALL" || row.state === statusFilter;
    const matchesSearch = !normalizedSearch || `${row.ideaName} ${row.teamName} ${row.category || ""}`.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  function connectionLabel() {
    if (connection === "offline") return "Offline, dados locais exibidos";
    if (connection === "reconnecting") return "Reconectando...";
    return "Atualização automática a cada 5s";
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">{connection === "offline" ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}{connectionLabel()}</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Ranking em Tempo Real</h1><p className="mt-2 text-base text-ink-muted">{phaseName}{summary?.updatedAt ? ` · atualizado ${new Date(summary.updatedAt).toLocaleTimeString("pt-BR")}` : ""}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold hover:bg-surface-low" aria-expanded={filtersOpen}><Filter className="size-4" />Filtros</button><button type="button" onClick={() => setExportNotice("Exportação disponível quando o ranking for fechado.")} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold hover:bg-surface-low"><Download className="size-4" />Exportar</button></div></section>
        {notice ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{notice}</p> : null}
        {exportNotice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{exportNotice}</p> : null}
        {filtersOpen ? <section className="flex flex-col gap-3 rounded-lg border border-black/[0.04] bg-white p-4 shadow-card sm:flex-row sm:items-end" aria-label="Filtros do ranking"><label className="flex-1 text-xs font-bold text-ink-muted">Buscar ideia ou equipe<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex: EcoTrack" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="w-full text-xs font-bold text-ink-muted sm:w-56">Fase<select value={phaseId} onChange={(event) => setPhaseId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40">{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label><label className="w-full text-xs font-bold text-ink-muted sm:w-48">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | RankingState)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="ALL">Todos</option><option value="PENDING">Pendentes</option><option value="PARTIAL">Em progresso</option><option value="COMPLETE">Completas</option></select></label></section> : null}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do ranking"><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Ideias na fase</p><p className="mt-5 text-4xl font-bold tracking-[-0.06em] text-ink">{summary?.totalIdeas ?? 0}</p></article><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Média global</p><p className="mt-5 text-4xl font-bold tracking-[-0.06em] text-ink">{summary?.averageScore?.toFixed(2) ?? "--"}</p></article><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Avaliações concluídas</p><p className="mt-5 text-4xl font-bold tracking-[-0.06em] text-ink">{summary?.completionPercent ?? 0}%</p><ProgressBar value={summary?.completionPercent ?? 0} showLabel={false} className="mt-4" /></article><article className="rounded-lg border border-black/[0.04] bg-primary p-5 text-white shadow-card"><p className="text-sm font-semibold text-white/60">Recebidas / esperadas</p><p className="mt-5 text-4xl font-bold tracking-[-0.06em] text-lime">{summary?.receivedEvaluations ?? 0} / {summary?.expectedEvaluations ?? 0}</p></article></section>
        <section className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card" aria-labelledby="ranking-title"><div className="flex items-center justify-between gap-4 border-b border-outline/30 px-5 py-6 sm:px-7"><div><h2 id="ranking-title" className="text-2xl font-medium tracking-[-0.04em] text-ink">Classificação Geral</h2><p className="mt-1 text-sm text-ink-muted">Somente avaliações enviadas participam da nota final.</p></div><div className="flex flex-wrap gap-2"><Badge tone="lime"><CheckCircle2 className="size-3.5" />{rows.filter((row) => row.state === "COMPLETE").length} completas</Badge><Badge tone="amber"><Clock3 className="size-3.5" />{rows.filter((row) => row.state === "PARTIAL").length} parciais</Badge></div></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-surface-low/60"><th className="px-5 py-4 text-xs font-semibold text-ink-muted sm:px-7">Rank</th><th className="px-5 py-4 text-xs font-semibold text-ink-muted">Nome da Ideia</th><th className="px-5 py-4 text-xs font-semibold text-ink-muted">Equipe</th><th className="px-5 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Avaliações</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Conclusão</th><th className="px-5 py-4 text-right text-xs font-semibold text-ink-muted sm:px-7">Nota Final</th></tr></thead><tbody className="divide-y divide-outline/30">{loading ? <tr><td colSpan={7} className="px-6 py-14 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto size-5 animate-spin" />Carregando ranking...</td></tr> : visibleRows.map((row) => <tr key={row.ideaId} className="transition-colors hover:bg-surface-low/50"><td className="px-5 py-4 text-sm font-bold text-ink sm:px-7">{row.rank ?? "--"}</td><td className="px-5 py-4"><p className="font-bold text-ink">{row.ideaName}</p><p className="mt-0.5 text-xs text-ink-muted">{row.category || "Sem categoria"}</p></td><td className="px-5 py-4 text-sm text-ink">{row.teamName}</td><td className="px-5 py-4"><Badge tone={row.state === "COMPLETE" ? "lime" : row.state === "PARTIAL" ? "amber" : "indigo"}>{stateLabel[row.state]}</Badge></td><td className="px-5 py-4 text-right text-sm text-ink">{row.receivedEvaluations} / {row.expectedEvaluations}</td><td className="px-5 py-4 text-right text-sm text-ink">{row.completionPercent}%</td><td className="px-5 py-4 text-right sm:px-7"><span className={`inline-flex min-w-16 justify-center rounded-md px-3 py-2 text-base font-bold ${row.finalScore === null ? "bg-surface-container text-ink-muted" : row.rank === 1 ? "bg-lime text-ink" : "bg-surface-container text-ink"}`}>{row.finalScore === null ? "--" : row.finalScore.toFixed(2)}</span></td></tr>)}</tbody></table></div>{!loading && !visibleRows.length ? <div className="px-6 py-12 text-center"><Search className="mx-auto size-7 text-ink-muted" /><p className="mt-3 text-sm font-semibold text-ink">Nenhuma ideia encontrada</p><p className="mt-1 text-xs text-ink-muted">Ajuste os filtros para ver outros resultados.</p></div> : null}</section>
      </div>
    </AppShell>
  );
}
