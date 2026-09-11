"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Layers3, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import type { PhaseStatus } from "@/lib/phase-status";

type Phase = { id: string; name: string; position: number; status: PhaseStatus; startsAt: string | null; endsAt: string | null };
type PhasePayload = { name?: string; position?: number; status?: PhaseStatus; startsAt?: string | null; endsAt?: string | null };
const statusLabels: Record<PhaseStatus, string> = { DRAFT: "Rascunho", READY: "Pronta", LIVE: "Ao vivo", CLOSED: "Encerrada" };

function partsForDate(value: string, timeZone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function toInputDateTime(value: string | null, timeZone: string) {
  if (!value) return "";
  const parts = partsForDate(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function toZonedIso(value: string, timeZone: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;
  for (let index = 0; index < 2; index += 1) {
    const parts = partsForDate(new Date(instant).toISOString(), timeZone);
    const displayed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    instant += desired - displayed;
  }
  return new Date(instant).toISOString();
}

function formatDateTime(value: string | null, timeZone: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone, dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : null;
}

export function PhaseManagementPage({ ideathonId }: { ideathonId: string }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [name, setName] = useState("");
  const [position, setPosition] = useState(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingPosition, setEditingPosition] = useState(0);
  const [editingStartsAt, setEditingStartsAt] = useState("");
  const [editingEndsAt, setEditingEndsAt] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ideathons/${ideathonId}/phases`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as fases.");
      return payload;
    }).then((payload) => {
      if (!active) return;
      setPhases(payload.data);
      setPosition(payload.data.length);
      setTimezone(payload.ideathon.timezone);
    }).catch((loadError: Error) => active && setError(loadError.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [ideathonId]);

  function datePayload(start: string, end: string) {
    if (start && end && end < start) throw new Error("O término da fase deve ser posterior ao início.");
    return { startsAt: toZonedIso(start, timezone), endsAt: toZonedIso(end, timezone) };
  }

  async function createPhase() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const dates = datePayload(startsAt, endsAt);
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, position, ...dates }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível criar a fase.");
      setPhases((current) => [...current, payload.data].sort((left, right) => left.position - right.position));
      setName("");
      setStartsAt("");
      setEndsAt("");
      setPosition((current) => current + 1);
      setNotice("Fase criada com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível criar a fase.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePhase(id: string, updates: PhasePayload) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar a fase.");
      setPhases((current) => current.map((phase) => phase.id === id ? { ...phase, ...payload.data } : phase).sort((left, right) => left.position - right.position));
      setEditingId("");
      setNotice("Fase atualizada com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível atualizar a fase.");
    } finally {
      setSaving(false);
    }
  }

  function openEditor(phase: Phase) {
    setEditingId(phase.id);
    setEditingName(phase.name);
    setEditingPosition(phase.position);
    setEditingStartsAt(toInputDateTime(phase.startsAt, timezone));
    setEditingEndsAt(toInputDateTime(phase.endsAt, timezone));
  }

  async function saveEditor() {
    try {
      const dates = datePayload(editingStartsAt, editingEndsAt);
      await updatePhase(editingId, { name: editingName, position: editingPosition, ...dates });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível atualizar a fase.");
    }
  }

  async function removePhase(phase: Phase) {
    if (!window.confirm(`Remover a fase “${phase.name}”?`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases/${phase.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível remover a fase.");
      setPhases((current) => current.filter((item) => item.id !== phase.id));
      setNotice("Fase removida com sucesso.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Não foi possível remover a fase.");
    } finally {
      setSaving(false);
    }
  }

  return <AppShell navigation="management" activeSection="ideathons" darkHeader><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section><Link href={`/admin/ideathons/${ideathonId}`} className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep hover:underline">Resumo do ideathon</Link><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Fases do ideathon</h1><p className="mt-2 max-w-2xl text-base text-ink-muted">Defina a janela de cada etapa no fuso do evento: {timezone}.</p></section>{notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}{error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}<section className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-lime/30 text-lime-deep"><Plus className="size-5" /></span><div><h2 className="text-lg font-bold text-ink">Cadastrar etapa</h2><p className="text-sm text-ink-muted">A nova etapa começa como rascunho.</p></div></div><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_120px_1fr_1fr_auto] xl:items-end"><label className="text-xs font-bold text-ink-muted">Nome da etapa<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Avaliação final" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="text-xs font-bold text-ink-muted">Posição<input type="number" min="0" value={position} onChange={(event) => setPosition(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="text-xs font-bold text-ink-muted">Início<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="text-xs font-bold text-ink-muted">Término<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><Button type="button" disabled={loading || saving || !name.trim()} onClick={() => void createPhase()}><Plus className="size-4" />Cadastrar etapa</Button></div></section><section className="space-y-3" aria-label="Etapas cadastradas">{loading ? <p className="rounded-lg bg-white p-10 text-center text-sm text-ink-muted">Carregando fases...</p> : phases.map((phase) => <article key={phase.id} className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-lime"><Layers3 className="size-5" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Etapa {phase.position + 1}</p><h2 className="truncate text-lg font-bold text-ink">{phase.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><CalendarClock className="size-3.5" />{formatDateTime(phase.startsAt, timezone) || "Início não definido"} · {formatDateTime(phase.endsAt, timezone) || "Término não definido"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${phase.status === "LIVE" ? "bg-lime/30 text-lime-deep" : phase.status === "CLOSED" ? "bg-surface-container text-ink-muted" : "bg-indigo/10 text-indigo-deep"}`}>{statusLabels[phase.status]}</span></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={() => openEditor(phase)}><Pencil className="size-4" />Editar</Button>{phase.status === "DRAFT" ? <Button type="button" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "READY" })}><Check className="size-4" />Marcar pronta</Button> : null}{phase.status === "READY" ? <Button type="button" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "LIVE" })}>Iniciar fase</Button> : null}{phase.status === "LIVE" ? <><Button type="button" variant="secondary" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "READY" })}><RotateCcw className="size-4" />Voltar para edição</Button><Button type="button" variant="danger" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "CLOSED" })}>Encerrar fase</Button></> : null}{phase.status === "CLOSED" ? <Button type="button" variant="secondary" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "READY" })}><RotateCcw className="size-4" />Reabrir</Button> : null}{phase.status === "DRAFT" || phase.status === "READY" ? <Button type="button" variant="ghost" disabled={saving} onClick={() => void removePhase(phase)}><Trash2 className="size-4" />Excluir</Button> : null}</div></div>{editingId === phase.id ? <div className="mt-5 grid grid-cols-1 gap-3 rounded-md bg-surface-low p-4 md:grid-cols-2 xl:grid-cols-[1fr_120px_1fr_1fr_auto]"><label className="text-xs font-bold text-ink-muted">Nome<input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><label className="text-xs font-bold text-ink-muted">Posição<input type="number" min="0" value={editingPosition} onChange={(event) => setEditingPosition(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><label className="text-xs font-bold text-ink-muted">Início<input type="datetime-local" value={editingStartsAt} onChange={(event) => setEditingStartsAt(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><label className="text-xs font-bold text-ink-muted">Término<input type="datetime-local" value={editingEndsAt} onChange={(event) => setEditingEndsAt(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><div className="flex items-end gap-2"><Button type="button" disabled={saving || !editingName.trim()} onClick={() => void saveEditor()} className="px-3"><Save className="size-4" /><span className="sr-only">Salvar</span></Button><Button type="button" variant="ghost" onClick={() => setEditingId("")} className="px-3"><X className="size-4" /><span className="sr-only">Cancelar</span></Button></div></div> : null}</article>)}{!loading && !phases.length ? <p className="rounded-lg border border-dashed border-outline bg-white p-10 text-center text-sm text-ink-muted">Nenhuma fase cadastrada.</p> : null}</section></div></AppShell>;
}
