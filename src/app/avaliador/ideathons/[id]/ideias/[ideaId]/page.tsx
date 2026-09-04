"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Expand, List, LoaderCircle, Save, Send, Type, Wifi, WifiOff } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

type Criterion = { id: string; name: string; description: string; position: number; weight: number };
type Idea = { id: string; name: string; problem: string; solution: string; audience: string | null; differentiation: string | null; category: string | null; pitchDeckUrl: string | null; videoPitchUrl: string | null; websiteUrl: string | null; teamName: string };
type EvaluationData = { evaluationId: string; status: "DRAFT" | "SUBMITTED"; feedback: string | null; finalScore: string | null; submittedAt: string | null; updatedAt: string | null; idea: Idea; criteria: Criterion[]; scores: Array<{ criterionId: string; score: number }> };
type Draft = { scores: Record<string, number>; feedback: string; savedAt: number };

function ScoreRail({ name, value, disabled, onChange }: { name: string; value?: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <div className="relative rounded-md bg-surface-low px-5 py-2.5 sm:px-7"><div className="absolute left-7 right-7 top-1/2 h-0.5 -translate-y-1/2 bg-outline/40 sm:left-10 sm:right-10" aria-hidden="true" /><div className="relative grid grid-cols-5 items-center justify-between">{[1, 2, 3, 4, 5].map((score) => { const selected = value === score; return <button key={score} type="button" name={name} disabled={disabled} aria-label={`Nota ${score}`} aria-pressed={selected} onClick={() => onChange(score)} className={`mx-auto flex size-10 items-center justify-center rounded-full border-2 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 disabled:cursor-not-allowed ${selected ? "border-primary bg-primary text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]" : "border-outline bg-white text-ink hover:-translate-y-0.5 hover:border-ink"}`}>{score}</button>; })}</div></div>;
}

const localKey = (phaseId: string, ideaId: string) => `ideathon:evaluation:${phaseId}:${ideaId}`;

export default function EvaluatorVotingPage() {
  const params = useParams<{ id: string; ideaId: string }>();
  const searchParams = useSearchParams();
  const ideathonId = String(params.id);
  const ideaId = String(params.ideaId);
  const requestedPhaseId = searchParams.get("phaseId") || "";
  const [phaseId, setPhaseId] = useState(requestedPhaseId);
  const [phaseName, setPhaseName] = useState("Fase de avaliação");
  const [data, setData] = useState<EvaluationData | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "queued" | "saving" | "error">("saved");
  const [connection, setConnection] = useState<"online" | "offline">("online");
  const latestDraft = useRef<Draft>({ scores: {}, feedback: "", savedAt: 0 });
  const saveTimer = useRef<number | null>(null);
  const requestInFlight = useRef(false);
  const pendingDraft = useRef<Draft | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const phasesResponse = await fetch(`/api/evaluator/ideathons/${ideathonId}/phases`, { cache: "no-store" });
        const phasesPayload = await phasesResponse.json();
        if (!phasesResponse.ok) throw new Error(phasesPayload.error || "Não foi possível carregar as fases.");
        const selectedPhase = phasesPayload.data.find((phase: { id: string; status: string }) => phase.id === requestedPhaseId) || phasesPayload.data.find((phase: { status: string }) => phase.status === "LIVE");
        if (!selectedPhase) throw new Error("Nenhuma fase disponível para avaliação.");
        const ideasResponse = await fetch(`/api/evaluator/phases/${selectedPhase.id}/ideas`, { cache: "no-store" });
        const ideasPayload = await ideasResponse.json();
        if (!ideasResponse.ok) throw new Error(ideasPayload.error || "Não foi possível carregar as ideias.");
        if (!ideasPayload.data.some((idea: { ideaId: string }) => idea.ideaId === ideaId)) throw new Error("Esta ideia não está atribuída à sua sala.");
        const evaluationResponse = await fetch(`/api/evaluator/phases/${selectedPhase.id}/ideas/${ideaId}/evaluation`, { cache: "no-store" });
        const evaluationPayload = await evaluationResponse.json();
        if (!evaluationResponse.ok) throw new Error(evaluationPayload.error || "Não foi possível carregar a avaliação.");
        if (!active) return;
        const evaluation = evaluationPayload.data as EvaluationData;
        const serverScores = Object.fromEntries(evaluation.scores.map((score) => [score.criterionId, score.score]));
        const stored = evaluation.status === "DRAFT" ? window.localStorage.getItem(localKey(selectedPhase.id, ideaId)) : null;
        let localDraft: Draft | null = null;
        if (stored) {
          try {
            localDraft = JSON.parse(stored) as Draft;
          } catch {
            window.localStorage.removeItem(localKey(selectedPhase.id, ideaId));
          }
        }
        const useLocal = localDraft !== null && localDraft.savedAt > (evaluation.updatedAt ? new Date(evaluation.updatedAt).getTime() : 0);
        const loadedScores = useLocal && localDraft ? localDraft.scores : serverScores;
        const loadedFeedback = useLocal && localDraft ? localDraft.feedback : evaluation.feedback || "";
        setPhaseId(selectedPhase.id);
        setPhaseName(selectedPhase.name);
        setData(evaluation);
        setScores(loadedScores);
        setFeedback(loadedFeedback);
        latestDraft.current = { scores: loadedScores, feedback: loadedFeedback, savedAt: useLocal && localDraft ? localDraft.savedAt : Date.now() };
        if (useLocal) pendingDraft.current = latestDraft.current;
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : "Não foi possível carregar a avaliação.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [ideathonId, ideaId, requestedPhaseId]);

  async function syncDraft(draft: Draft) {
    if (!phaseId || !data || data.status === "SUBMITTED") return;
    if (!navigator.onLine) {
      pendingDraft.current = draft;
      setConnection("offline");
      setSaveState("queued");
      return;
    }
    if (requestInFlight.current) {
      pendingDraft.current = draft;
      return;
    }
    requestInFlight.current = true;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/evaluator/phases/${phaseId}/ideas/${ideaId}/evaluation`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: Object.entries(draft.scores).map(([criterionId, score]) => ({ criterionId, score })), feedback: draft.feedback }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar o rascunho.");
      if (payload.data) setData((current) => current ? { ...current, ...payload.data } : current);
      if (pendingDraft.current === draft) {
        pendingDraft.current = null;
        setSaveState("saved");
      } else {
        setSaveState("queued");
      }
      setConnection("online");
      setNotice("");
    } catch (error) {
      if (!pendingDraft.current || pendingDraft.current === draft) pendingDraft.current = draft;
      setSaveState("error");
      setNotice(error instanceof Error ? error.message : "Rascunho mantido localmente; nova tentativa pendente.");
    } finally {
      requestInFlight.current = false;
      if (pendingDraft.current && pendingDraft.current !== draft && navigator.onLine) void syncDraft(pendingDraft.current);
    }
  }

  function queueDraft(nextScores: Record<string, number>, nextFeedback: string) {
    const draft = { scores: nextScores, feedback: nextFeedback, savedAt: Date.now() };
    latestDraft.current = draft;
    window.localStorage.setItem(localKey(phaseId, ideaId), JSON.stringify(draft));
    pendingDraft.current = draft;
    setSaveState("queued");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void syncDraft(draft), 800);
  }

  useEffect(() => {
    const onOnline = () => { setConnection("online"); if (pendingDraft.current) void syncDraft(pendingDraft.current); };
    const onOffline = () => setConnection("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (pendingDraft.current && phaseId && data?.status === "DRAFT") void syncDraft(pendingDraft.current);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [phaseId, data]);

  function setScore(criterionId: string, value: number) {
    const nextScores = { ...scores, [criterionId]: value };
    setScores(nextScores);
    setNotice("");
    queueDraft(nextScores, feedback);
  }

  function setFeedbackValue(value: string) {
    setFeedback(value);
    queueDraft(scores, value);
  }

  async function saveDraft() {
    await syncDraft(latestDraft.current);
    if (saveState !== "error") setNotice("Rascunho salvo.");
  }

  async function submitEvaluation(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!data || data.status === "SUBMITTED") return;
    if (data.criteria.some((criterion) => scores[criterion.id] === undefined)) {
      setNotice("Responda todos os critérios antes de enviar a avaliação.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/evaluations/${data.evaluationId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: Object.entries(scores).map(([criterionId, score]) => ({ criterionId, score })), feedback: feedback || null }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a avaliação.");
      setData((current) => current ? { ...current, ...payload.data } : current);
      window.localStorage.removeItem(localKey(phaseId, ideaId));
      pendingDraft.current = null;
      setSaveState("saved");
      setNotice(payload.data.idempotent ? "Esta avaliação já havia sido enviada." : "Avaliação enviada com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível enviar a avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell navigation="evaluator" activeSection="ideathons"><div className="mx-auto flex min-h-[60vh] max-w-container items-center justify-center px-4"><LoaderCircle className="size-6 animate-spin text-lime-deep" /></div></AppShell>;
  if (!data) return <AppShell navigation="evaluator" activeSection="ideathons"><div className="mx-auto max-w-container px-4 py-10"><p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{notice || "Avaliação indisponível."}</p></div></AppShell>;

  const answered = data.criteria.filter((criterion) => scores[criterion.id] !== undefined).length;
  const progress = Math.round((answered / data.criteria.length) * 100);
  const readOnly = data.status === "SUBMITTED";
  const saveLabel = connection === "offline" ? "Offline" : saveState === "saving" ? "Salvando..." : saveState === "queued" ? "Pendente" : "Salvo";

  return <AppShell navigation="evaluator" activeSection="ideathons"><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-3 flex flex-wrap items-center gap-3"><Badge tone={readOnly ? "indigo" : "lime"} className="rounded-sm px-2.5 py-1 uppercase tracking-[0.1em]">{readOnly ? "Enviada" : "Em avaliação"}</Badge><span className="text-sm font-semibold text-ink-muted">{phaseName}</span></div><h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">Painel do Avaliador - {data.idea.name}</h1><p className="mt-2 max-w-3xl text-base leading-7 text-ink-muted">{data.idea.solution}</p></div><div className="flex flex-wrap items-center gap-3 xl:pb-1"><div className="flex items-center gap-2 text-sm text-ink-muted">{connection === "offline" ? <WifiOff className="size-4 text-danger" /> : <Wifi className="size-4 text-lime-deep" />}Progresso: {progress}%</div><span className="text-xs font-semibold text-ink-muted">{saveLabel}</span><Button type="button" variant="secondary" disabled={readOnly || saveState === "saving"} onClick={() => void saveDraft()}><Save className="size-4" />Salvar rascunho</Button><Button type="button" disabled={readOnly || submitting} onClick={() => void submitEvaluation()}><Send className="size-4" />{submitting ? "Enviando..." : "Enviar avaliação"}</Button></div></section>
    {notice ? <p className={`rounded-md px-4 py-3 text-sm font-semibold ${notice.includes("sucesso") || notice.includes("salvo") || notice.includes("enviada") ? "bg-lime/30 text-lime-deep" : "bg-danger-soft/60 text-danger"}`} role="status">{notice}</p> : null}
    <ProgressBar value={progress} showLabel={false} />
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(330px,0.34fr)_minmax(0,1fr)]"><aside className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card"><div className="relative h-56 overflow-hidden bg-[#dfe8e7]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(212,255,111,0.78),transparent_12%),radial-gradient(circle_at_42%_55%,rgba(27,141,143,0.72),transparent_21%),linear-gradient(135deg,#f1f4ef_0%,#b8d3ce_42%,#396f85_70%,#e6ece5_100%)] opacity-90" /><button type="button" className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-white/45 text-white backdrop-blur-sm transition-colors hover:bg-primary" aria-label="Expandir imagem"><Expand className="size-5" /></button></div><div className="p-6"><h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Visão geral</h2><div className="mt-6 space-y-5"><div><p className="text-sm text-ink-muted">Equipe</p><p className="mt-2 text-base font-medium text-ink">{data.idea.teamName}</p></div><div><p className="text-sm text-ink-muted">Categoria</p><span className="mt-2 inline-flex rounded-full bg-surface-container px-3 py-1.5 text-sm font-medium text-ink">{data.idea.category || "Sem categoria"}</span></div><div><p className="text-sm text-ink-muted">Problema</p><p className="mt-2 text-sm leading-6 text-ink">{data.idea.problem}</p></div><div><p className="text-sm text-ink-muted">Público</p><p className="mt-2 text-sm leading-6 text-ink">{data.idea.audience || "Não informado"}</p></div></div>{data.idea.pitchDeckUrl ? <div className="mt-5 border-t border-outline/30 pt-5"><a href={data.idea.pitchDeckUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-base font-medium text-indigo-deep transition-colors hover:text-indigo"><Download className="size-4" />Baixar Pitch Deck</a></div> : null}</div></aside>
      <div className="space-y-5"><section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="evaluation-criteria-title"><div className="flex items-center justify-between gap-4 border-b border-outline/30 pb-5"><h2 id="evaluation-criteria-title" className="text-xl font-medium tracking-[-0.03em] text-ink">Critérios de Avaliação</h2><span className="text-sm text-ink-muted sm:text-base">1 = Insatisfatório, 5 = Excelente</span></div><form onSubmit={submitEvaluation} className="divide-y divide-outline/30">{data.criteria.map((criterion) => <fieldset key={criterion.id} disabled={readOnly} className="border-0 py-6 first:pt-7 last:pb-1"><legend className="w-full"><span className="block text-base font-medium text-ink sm:text-lg">{criterion.name} <span className="text-xs font-bold text-ink-muted">({criterion.weight}%)</span></span><span className="mt-1 block text-sm leading-6 text-ink sm:text-base">{criterion.description}</span></legend><div className="mt-5"><ScoreRail name={criterion.id} value={scores[criterion.id]} disabled={readOnly} onChange={(value) => setScore(criterion.id, value)} /></div></fieldset>)}</form></section><section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="feedback-title"><h2 id="feedback-title" className="text-xl font-medium tracking-[-0.03em] text-ink">Comentários / Feedback</h2><p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">Destaque pontos fortes e áreas de melhoria.</p><div className="relative mt-5"><label htmlFor="feedback" className="sr-only">Escreva suas observações</label><textarea id="feedback" disabled={readOnly} value={feedback} onChange={(event) => setFeedbackValue(event.target.value)} placeholder="Escreva suas observações aqui..." className="min-h-48 w-full resize-y rounded-md border border-outline/50 bg-surface-low px-5 py-4 pb-12 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:cursor-not-allowed disabled:opacity-70" /><div className="absolute bottom-3 right-4 flex items-center gap-2 text-ink-muted"><button type="button" className="rounded p-1.5 hover:bg-surface-container" aria-label="Negrito"><Type className="size-4" /></button><button type="button" className="rounded p-1.5 hover:bg-surface-container" aria-label="Lista"><List className="size-4" /></button></div></div></section></div></div>
  </div></AppShell>;
}
