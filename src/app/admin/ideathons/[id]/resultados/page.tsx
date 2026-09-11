"use client";

import { useEffect, useState } from "react";
import { DoorOpen, Download, Filter, LoaderCircle, Trophy, Wifi, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RankingTable, rankingStateLabels } from "@/components/ranking-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { RankingResultRow, RankingSummary, RoomRanking } from "@/lib/ranking-results";

type RankingState = "PENDING" | "PARTIAL" | "COMPLETE";
type Phase = { id: string; name: string; position: number; status: string };
type RankingResponse = { phase: Phase; phases: Phase[]; data: RankingResultRow[]; summary: RankingSummary; roomRankings: RoomRanking[] };
type View = "general" | "rooms";

const phaseStatusLabels: Record<string, string> = { DRAFT: "Rascunho", READY: "Pronta", LIVE: "Ao vivo", CLOSED: "Encerrada" };

export default function RankingPage() {
  const params = useParams<{ id: string }>();
  const ideathonId = String(params.id);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phaseId, setPhaseId] = useState("");
  const [result, setResult] = useState<RankingResponse | null>(null);
  const [view, setView] = useState<View>("general");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RankingState>("ALL");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [connection, setConnection] = useState<"connected" | "offline" | "reconnecting">("reconnecting");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (!navigator.onLine) {
        if (active) { setConnection("offline"); setLoading(false); }
        return;
      }
      if (inFlight) return;
      inFlight = true;
      setConnection((current) => current === "connected" ? current : "reconnecting");
      try {
        const query = phaseId ? `?phaseId=${encodeURIComponent(phaseId)}` : "";
        const response = await fetch(`/api/admin/ideathons/${ideathonId}/results${query}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o ranking.");
        if (!active) return;
        setPhases(payload.phases);
        setPhaseId((current) => current || payload.phase.id);
        setResult(payload as RankingResponse);
        setNotice("");
        setConnection("connected");
      } catch (error) {
        if (!active) return;
        setConnection(navigator.onLine ? "reconnecting" : "offline");
        setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o ranking.");
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 5000);
    const onOnline = () => void refresh();
    const onOffline = () => setConnection("offline");
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ideathonId, phaseId]);

  function selectPhase(nextPhaseId: string) {
    setPhaseId(nextPhaseId);
    setResult(null);
    setLoading(true);
    setNotice("");
    setExportNotice("");
    setConnection("reconnecting");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filterRows = (rows: RankingResultRow[]) => rows.filter((row) => {
    const matchesStatus = statusFilter === "ALL" || row.state === statusFilter;
    const matchesSearch = !normalizedSearch || `${row.ideaName} ${row.teamName} ${row.category || ""} ${row.roomName || ""}`.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });
  const summary = result?.summary;
  const phaseName = result?.phase.name || phases.find((phase) => phase.id === phaseId)?.name || "Selecione uma fase";
  const connectionLabel = connection === "offline" ? "Sem conexão · última atualização disponível" : connection === "reconnecting" ? "Reconectando..." : "Atualização automática a cada 5 s";

  function exportResults() {
    if (!result) return;
    try {
      // Export the same snapshot and filtered rows that are displayed. Room
      // positions come from the independent rankings, never from global ranks.
      const exportRows = view === "general" ? filterRows(result.data) : result.roomRankings.flatMap((room) => filterRows(room.data));
      const csv = [
        "fase,sala,visualização,posição,ideia,equipe,status,avaliações,nota",
        ...exportRows.map((row) => [result.phase.name, row.roomName || "Sem sala", view === "general" ? "Geral da fase" : "Por sala", row.rank ?? "", row.ideaName, row.teamName, rankingStateLabels[row.state], `${row.receivedEvaluations}/${row.expectedEvaluations}`, row.finalScore ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
      ].join("\n");
      const link = document.createElement("a");
      const url = URL.createObjectURL(new Blob([`\ufeff${csv}\n`], { type: "text/csv;charset=utf-8" }));
      link.href = url;
      link.download = `ranking-${ideathonId}-${result.phase.id}-${view === "general" ? "geral" : "por-sala"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExportNotice(`Ranking ${view === "general" ? "geral" : "por sala"} exportado: ${exportRows.length} ${exportRows.length === 1 ? "ideia" : "ideias"} da fase ${result.phase.name}.`);
    } catch (error) {
      setExportNotice(error instanceof Error ? error.message : "Não foi possível exportar o ranking.");
    }
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">{connection === "offline" ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}{connectionLabel}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Ranking em tempo real</h1>
            <p className="mt-2 text-base text-ink-muted">{phaseName}{summary?.updatedAt ? ` · atualizado ${new Date(summary.updatedAt).toLocaleTimeString("pt-BR")}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold hover:bg-surface-low" aria-expanded={filtersOpen} aria-controls="ranking-filters"><Filter className="size-4" />Filtros</button>
            <button type="button" disabled={!result || loading} onClick={exportResults} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50"><Download className="size-4" />Exportar CSV</button>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-5 rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex-row sm:items-end sm:p-5" aria-label="Visualização e fase do ranking">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">Visualização</p>
            <div role="group" aria-label="Visualização do ranking" className="inline-flex flex-wrap gap-1 rounded-md bg-surface-low p-1">
              <button type="button" aria-pressed={view === "general"} onClick={() => { setView("general"); setExportNotice(""); }} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime ${view === "general" ? "bg-primary text-lime shadow-sm" : "text-ink-muted hover:bg-white"}`}><Trophy className="size-4" />Geral da fase</button>
              <button type="button" aria-pressed={view === "rooms"} onClick={() => { setView("rooms"); setExportNotice(""); }} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime ${view === "rooms" ? "bg-primary text-lime shadow-sm" : "text-ink-muted hover:bg-white"}`}><DoorOpen className="size-4" />Por sala</button>
            </div>
          </div>
          <label className="w-full text-xs font-bold text-ink-muted sm:max-w-xs">Fase
            <select value={phaseId} disabled={!phases.length} onChange={(event) => selectPhase(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40">
              {!phases.length ? <option value="">Carregando fases...</option> : null}
              {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name} ({phaseStatusLabels[phase.status] || phase.status})</option>)}
            </select>
          </label>
        </section>

        {notice ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{notice}</p> : null}
        {exportNotice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{exportNotice}</p> : null}
        {filtersOpen ? <section id="ranking-filters" className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-card sm:flex-row sm:items-end" aria-label="Filtros do ranking">
          <label className="flex-1 text-xs font-bold text-ink-muted">Buscar ideia, equipe ou sala<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex: EcoTrack, Equipe Horizonte ou Sala 21" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" /></label>
          <label className="w-full text-xs font-bold text-ink-muted sm:w-48">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | RankingState)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="ALL">Todos</option><option value="PENDING">Sem avaliações</option><option value="PARTIAL">Em andamento</option><option value="COMPLETE">Concluídas</option></select></label>
        </section> : null}

        {loading ? <div role="status" className="rounded-lg bg-white px-6 py-14 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto mb-3 size-5 animate-spin" />Carregando ranking da fase...</div> : !result ? <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">Os resultados desta fase ainda não foram carregados. A atualização será tentada novamente automaticamente.</p> : <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo geral da fase">
            <article className="rounded-lg bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Ideias na fase</p><p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.06em] text-ink">{result.summary.totalIdeas}</p></article>
            <article className="rounded-lg bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Média geral da fase</p><p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.06em] text-ink">{result.summary.averageScore?.toFixed(2) ?? "--"}</p></article>
            <article className="rounded-lg bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Percentual de avaliações concluídas</p><p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.06em] text-ink">{result.summary.completionPercent}%</p><ProgressBar value={result.summary.completionPercent} showLabel={false} className="mt-4" /></article>
            <article className="rounded-lg bg-primary p-5 text-white shadow-card"><p className="text-sm font-semibold text-white/60">Avaliações recebidas / esperadas</p><p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.06em] text-lime">{result.summary.receivedEvaluations} / {result.summary.expectedEvaluations}</p></article>
          </section>

          {view === "general" ? <RankingTable title="Classificação Geral" description={`${result.phase.name} · Todas as ideias da fase, reunindo todas as salas.`} rows={filterRows(result.data)} summary={result.summary} showRoom /> : <div className="space-y-5">
            <div><h2 className="text-lg font-bold text-ink">Classificação por sala</h2><p className="mt-1 text-sm text-ink-muted">{result.phase.name} · Cada sala tem suas próprias posições. Empates compartilham a mesma colocação.</p></div>
            {result.roomRankings.map((room) => <RankingTable key={room.roomId || "unassigned"} title={room.roomName} description={room.roomId ? `Ranking independente · ${result.phase.name}` : "Ideias sem sala atribuída. Disponíveis também na classificação geral."} rows={filterRows(room.data)} summary={room.summary} />)}
            {!result.roomRankings.length ? <p className="rounded-lg border border-dashed border-outline bg-white p-10 text-center text-sm text-ink-muted">Nenhuma sala cadastrada nesta fase.</p> : null}
          </div>}
        </>}
      </div>
    </AppShell>
  );
}
