"use client";

import { useEffect, useState } from "react";
import { Check, Layers3, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import type { PhaseStatus } from "@/lib/phase-status";

type Phase = { id: string; name: string; position: number; status: PhaseStatus; startsAt?: string | null; endsAt?: string | null };
const statusLabels: Record<PhaseStatus, string> = { DRAFT: "Rascunho", READY: "Pronta", LIVE: "Ao vivo", CLOSED: "Encerrada" };

export function PhaseManagementPage({ ideathonId }: { ideathonId: string }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState(0);
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingPosition, setEditingPosition] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ideathons/${ideathonId}/phases`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as fases.");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setPhases(payload.data);
        setPosition(payload.data.length);
      })
      .catch((loadError: Error) => active && setError(loadError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [ideathonId]);

  async function createPhase() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, position }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível criar a fase.");
      setPhases((current) => [...current, payload.data].sort((left, right) => left.position - right.position));
      setName("");
      setPosition((current) => current + 1);
      setNotice("Fase criada com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível criar a fase.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePhase(id: string, updates: Partial<Phase>) {
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

  function changeStatus(phase: Phase, status: PhaseStatus, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    void updatePhase(phase.id, { status });
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

  return <AppShell navigation="management" activeSection="ideathons" darkHeader><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <section><Link href={`/admin/ideathons/${ideathonId}`} className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep hover:underline">Resumo do ideathon</Link><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Fases do ideathon</h1><p className="mt-2 max-w-2xl text-base text-ink-muted">Cadastre as etapas do evento, organize a ordem e controle quando cada uma fica disponível.</p></section>
    {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
    {error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
    <section className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7" aria-labelledby="new-phase-title"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-lime/30 text-lime-deep"><Plus className="size-5" /></span><div><h2 id="new-phase-title" className="text-lg font-bold text-ink">Cadastrar etapa</h2><p className="text-sm text-ink-muted">A nova etapa começa como rascunho.</p></div></div><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px_auto] md:items-end"><label className="text-xs font-bold text-ink-muted">Nome da etapa<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Avaliação final" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="text-xs font-bold text-ink-muted">Posição<input type="number" min="0" value={position} onChange={(event) => setPosition(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><Button type="button" disabled={loading || saving || !name.trim()} onClick={() => void createPhase()}><Plus className="size-4" />Cadastrar etapa</Button></div></section>
    <section className="space-y-3" aria-label="Etapas cadastradas">{loading ? <p className="rounded-lg bg-white p-10 text-center text-sm text-ink-muted">Carregando fases...</p> : phases.map((phase) => <article key={phase.id} className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-lime"><Layers3 className="size-5" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Etapa {phase.position + 1}</p><h2 className="truncate text-lg font-bold text-ink">{phase.name}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${phase.status === "LIVE" ? "bg-lime/30 text-lime-deep" : phase.status === "CLOSED" ? "bg-surface-container text-ink-muted" : "bg-indigo/10 text-indigo-deep"}`}>{statusLabels[phase.status]}</span></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={() => { setEditingId(phase.id); setEditingName(phase.name); setEditingPosition(phase.position); }}><Pencil className="size-4" />Editar</Button>{phase.status === "DRAFT" ? <Button type="button" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "READY" })}><Check className="size-4" />Marcar pronta</Button> : null}{phase.status === "READY" ? <Button type="button" disabled={saving} onClick={() => void updatePhase(phase.id, { status: "LIVE" })}>Iniciar fase</Button> : null}{phase.status === "LIVE" ? <><Button type="button" variant="secondary" disabled={saving} onClick={() => changeStatus(phase, "READY")}><RotateCcw className="size-4" />Voltar para edição</Button><Button type="button" variant="danger" disabled={saving} onClick={() => changeStatus(phase, "CLOSED", `Concluir a fase “${phase.name}”? Ela deixará de receber avaliações.`)}><Check className="size-4" />Concluir fase</Button></> : null}{phase.status === "CLOSED" ? <Button type="button" variant="secondary" disabled={saving} onClick={() => changeStatus(phase, "READY", `Reabrir a fase “${phase.name}” para edição?`)}><RotateCcw className="size-4" />Reabrir fase</Button> : null}{phase.status !== "LIVE" && phase.status !== "CLOSED" ? <Button type="button" variant="ghost" disabled={saving} onClick={() => void removePhase(phase)} aria-label={`Remover ${phase.name}`}><Trash2 className="size-4" /></Button> : null}</div></div>{editingId === phase.id ? <div className="mt-4 grid grid-cols-[1fr_100px_auto] items-end gap-2 rounded-md bg-surface-low p-3"><label className="text-xs font-bold text-ink-muted">Nome<input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><label className="text-xs font-bold text-ink-muted">Posição<input type="number" min="0" value={editingPosition} onChange={(event) => setEditingPosition(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><div className="flex gap-1"><Button type="button" disabled={saving || !editingName.trim()} onClick={() => void updatePhase(phase.id, { name: editingName, position: editingPosition })} className="px-3"><Save className="size-4" /><span className="sr-only">Salvar</span></Button><Button type="button" variant="ghost" disabled={saving} onClick={() => setEditingId("")} className="px-3"><span className="sr-only">Cancelar</span>Cancelar</Button></div></div> : null}</article>)}</section>
  </div></AppShell>;
}
