"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, ExternalLink, LoaderCircle, Pencil, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

type IdeathonData = { id: string; name: string; slug: string; description: string; status: "DRAFT" | "READY" | "LIVE" | "CLOSED"; timezone: string; startsAt: string | null; endsAt: string | null; phases: Array<{ id: string; name: string; status: string; position: number }>; ideas: Array<{ id: string; name: string; category: string | null; status: string; teamName: string }>; evaluationConfigs: Array<{ id: string; phaseId: string; status: string; version: number; criterionCount: number }>; evaluationProgress: { total: number; submitted: number; percent: number } };
const statusLabels: Record<string, string> = { DRAFT: "Rascunho", READY: "Pronto", LIVE: "Ao vivo", CLOSED: "Encerrado" };

export default function IdeathonDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const ideathonId = String(id);
  const [event, setEvent] = useState<IdeathonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/ideathons/${ideathonId}`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o ideathon.");
      setEvent(payload.data);
    }).catch((error: Error) => setNotice(error.message)).finally(() => setLoading(false));
  }, [ideathonId]);

  async function updateStatus(status: IdeathonData["status"]) {
    if (status === "CLOSED" && !window.confirm("Encerrar este ideathon? As fases e salas ao vivo precisam estar encerradas antes.")) return;
    setUpdatingStatus(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar o status.");
      setEvent((current) => current ? { ...current, status: payload.data.status } : current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) return <AppShell navigation="management" activeSection="ideathons"><div className="mx-auto flex min-h-[60vh] max-w-container items-center justify-center"><LoaderCircle className="size-6 animate-spin text-lime-deep" /></div></AppShell>;
  if (!event) return <AppShell navigation="management" activeSection="ideathons"><div className="mx-auto max-w-container px-4 py-10"><p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger">{notice || "Ideathon não encontrado."}</p></div></AppShell>;

  const livePhase = event.phases.find((phase) => phase.status === "LIVE");
  const activeIdeas = event.ideas.filter((idea) => idea.status === "ACTIVE");
  const configuredPhases = new Set(event.evaluationConfigs.map((config) => config.phaseId));
  const statusAction: { label: string; status: IdeathonData["status"] } | null = event.status === "DRAFT" ? { label: livePhase ? "Sincronizar como ao vivo" : "Marcar como pronto", status: livePhase ? "LIVE" : "READY" } : event.status === "READY" ? { label: "Voltar para rascunho", status: "DRAFT" } : event.status === "LIVE" ? { label: "Encerrar ideathon", status: "CLOSED" } : null;
  return <AppShell navigation="management" activeSection="ideathons" darkHeader><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><Link href="/admin/ideathons" className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep hover:underline">Ideathons</Link><div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-5xl">{event.name}</h1><Badge tone={event.status === "LIVE" ? "lime" : event.status === "CLOSED" ? "neutral" : "indigo"}>{statusLabels[event.status]}</Badge></div><p className="mt-3 max-w-3xl text-base leading-7 text-ink-muted">{event.description || "Sem descrição cadastrada."}</p></div><div className="flex flex-wrap items-center gap-3"><Link href={`/public/ideathons/${event.id}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-outline bg-white px-4 text-sm font-semibold hover:bg-surface-low"><ExternalLink className="size-4" />Página pública</Link><Link href={`/admin/ideathons/${event.id}/configuracao`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-lime px-4 text-sm font-bold text-lime-foreground hover:bg-lime/85"><Pencil className="size-4" />Editar configuração</Link>{statusAction ? <button type="button" onClick={() => updateStatus(statusAction.status)} disabled={updatingStatus} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${statusAction.status === "CLOSED" ? "bg-danger text-white hover:bg-danger/85" : "border border-outline bg-white text-ink hover:bg-surface-low"}`}>{updatingStatus ? <LoaderCircle className="size-4 animate-spin" /> : null}{updatingStatus ? "Atualizando" : statusAction.label}</button> : null}</div></section>{notice ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger">{notice}</p> : null}<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Ideias ativas</p><p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-ink">{activeIdeas.length}</p></article><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Fases</p><p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-ink">{event.phases.length}</p></article><article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink-muted">Configurações</p><p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-ink">{configuredPhases.size}</p></article><article className="rounded-lg border border-primary bg-primary p-5 text-white shadow-card"><p className="text-sm font-semibold text-white/60">Fase atual</p><p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-lime">{livePhase?.name || "Nenhuma ao vivo"}</p></article></section><section className="grid grid-cols-1 gap-5 lg:grid-cols-2"><article className="rounded-lg border border-outline/45 bg-white p-6 shadow-card"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-ink">Acesso rápido</h2><p className="mt-1 text-sm text-ink-muted">Áreas operacionais deste evento.</p></div><ArrowRight className="size-5 text-lime-deep" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/admin/ideathons/${event.id}/projetos`} className="rounded-md bg-surface-low p-4 hover:bg-lime/10"><ClipboardList className="size-5 text-lime-deep" /><p className="mt-3 font-bold text-ink">Ideias</p><p className="mt-1 text-xs text-ink-muted">Cadastrar e editar propostas</p></Link><Link href={`/admin/ideathons/${event.id}/salas`} className="rounded-md bg-surface-low p-4 hover:bg-lime/10"><Users className="size-5 text-lime-deep" /><p className="mt-3 font-bold text-ink">Salas e avaliadores</p><p className="mt-1 text-xs text-ink-muted">Distribuir bancas e ideias</p></Link><Link href={`/admin/ideathons/${event.id}/resultados`} className="rounded-md bg-surface-low p-4 hover:bg-lime/10"><ArrowRight className="size-5 text-lime-deep" /><p className="mt-3 font-bold text-ink">Resultados</p><p className="mt-1 text-xs text-ink-muted">Acompanhar ranking em tempo real</p></Link><Link href={`/admin/ideathons/${event.id}/auditoria`} className="rounded-md bg-surface-low p-4 hover:bg-lime/10"><ClipboardList className="size-5 text-lime-deep" /><p className="mt-3 font-bold text-ink">Auditoria</p><p className="mt-1 text-xs text-ink-muted">Consultar alterações e envios</p></Link></div></article><article className="rounded-lg border border-outline/45 bg-white p-6 shadow-card"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-ink">Fases do evento</h2><p className="mt-1 text-sm text-ink-muted">Status e configuração de avaliação.</p></div><Link href={`/admin/ideathons/${event.id}/configuracao`} aria-label="Configurar fases"><Settings className="size-5 text-ink-muted hover:text-ink" /></Link></div><div className="mt-5 divide-y divide-outline/30">{event.phases.map((phase) => <div key={phase.id} className="flex items-center justify-between gap-3 py-4 first:pt-0"><div><p className="font-semibold text-ink">{phase.position + 1}. {phase.name}</p><p className="mt-1 text-xs text-ink-muted">{configuredPhases.has(phase.id) ? "Critérios configurados" : "Sem critérios configurados"}</p></div><Badge tone={phase.status === "LIVE" ? "lime" : phase.status === "CLOSED" ? "neutral" : "indigo"}>{statusLabels[phase.status] || phase.status}</Badge></div>)}</div>{!event.phases.length ? <p className="py-8 text-center text-sm text-ink-muted">Nenhuma fase cadastrada.</p> : null}</article></section><section className="rounded-lg border border-outline/45 bg-white p-6 shadow-card"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-ink">Progresso das avaliações</h2><p className="mt-1 text-sm text-ink-muted">{event.evaluationProgress.submitted} de {event.evaluationProgress.total} avaliações enviadas.</p></div><Link href={`/admin/ideathons/${event.id}/resultados`} className="text-sm font-bold text-lime-deep hover:underline">Ver ranking</Link></div><div className="mt-5"><ProgressBar value={event.evaluationProgress.percent} /></div></section></div></AppShell>;
}
