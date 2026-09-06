"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, LoaderCircle, Plus, RotateCcw, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";

type Criterion = { id: string; name: string; description: string; position: number; weight: number };
type ScaleLevel = { value: number; label: string; description: string };
type Phase = { id: string; name: string; status: string };
const defaultScale: ScaleLevel[] = [{ value: 1, label: "Fraco", description: "Muito abaixo" }, { value: 2, label: "Abaixo", description: "Abaixo do esperado" }, { value: 3, label: "Adequado", description: "Atende ao esperado" }, { value: 4, label: "Muito bom", description: "Acima do esperado" }, { value: 5, label: "Excelente", description: "Referência" }];

export default function EvaluationConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const ideathonId = String(id);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phaseId, setPhaseId] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scale, setScale] = useState(defaultScale);
  const [newCriterion, setNewCriterion] = useState({ name: "", description: "", weight: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = phaseId ? `?phaseId=${encodeURIComponent(phaseId)}` : "";
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/evaluation-config${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar a configuração.");
      const result = payload.data;
      setPhases(result.phaseRows);
      setPhaseId((current: string) => current || result.phase.id);
      setPhaseName(result.phase.name);
      setCriteria(result.criteria);
      setScale(result.scale.length === 5 ? result.scale : defaultScale);
      setNotice("");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a configuração.");
    } finally {
      setLoading(false);
    }
  }, [ideathonId, phaseId]);

  useEffect(() => { void load(); }, [load]);

  function addCriterion() {
    const weight = Number(newCriterion.weight);
    if (!newCriterion.name.trim() || !newCriterion.description.trim() || !Number.isInteger(weight) || weight <= 0) {
      setError("Preencha nome, descrição e um peso inteiro positivo.");
      return;
    }
    setCriteria((current) => [...current, { id: `new-${Date.now()}`, name: newCriterion.name.trim(), description: newCriterion.description.trim(), position: current.length, weight }]);
    setNewCriterion({ name: "", description: "", weight: "" });
    setError("");
  }

  function updateCriterion(id: string, field: "name" | "description" | "weight", value: string) {
    setCriteria((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "weight" ? Number(value) || 0 : value } : item));
    setNotice("");
  }

  function moveCriterion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= criteria.length) return;
    setCriteria((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next.map((item, position) => ({ ...item, position })); });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/evaluation-config`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phaseId, criteria, scale }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar a configuração.");
      setCriteria(payload.data.criteria);
      setScale(payload.data.scale);
      setNotice("Configuração salva com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a configuração.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !phases.length) return <AppShell navigation="management" activeSection="ideathons"><div className="mx-auto flex min-h-[60vh] items-center justify-center"><LoaderCircle className="size-6 animate-spin text-lime-deep" /></div></AppShell>;
  const totalWeight = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  return <AppShell navigation="management" activeSection="ideathons"><div className="mx-auto w-full max-w-container space-y-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"><Link href={`/admin/ideathons/${ideathonId}`} className="hover:text-ink">Ideathon</Link><ChevronRight className="size-3.5" /><span>Configuração</span></div><h1 className="text-3xl font-bold tracking-[-0.05em] text-ink sm:text-4xl">Configuração de avaliação</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">Defina os critérios persistidos que os avaliadores usarão nesta fase.</p></div><div className="flex shrink-0 items-center gap-2"><Button type="button" variant="secondary" onClick={() => void load()}><RotateCcw className="size-4" />Recarregar</Button><Button type="button" disabled={saving || !phaseId} onClick={() => void save()}><Save className="size-4" />{saving ? "Salvando..." : "Salvar configuração"}</Button></div></section>{phases.length ? <section className="rounded-lg border border-outline/45 bg-white p-4 shadow-card"><label className="block max-w-md text-xs font-bold text-ink-muted">Fase<select value={phaseId} onChange={(event) => setPhaseId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40">{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name} ({phase.status})</option>)}</select></label></section> : null}{notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}{error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}<div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)]"><section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7"><h2 className="text-xl font-bold tracking-[-0.03em] text-ink">Adicionar critério</h2><p className="mt-2 text-sm text-ink-muted">Fase selecionada: {phaseName}</p><div className="mt-6 space-y-5"><Input id="criterion-name" label="Nome" required value={newCriterion.name} onChange={(event) => setNewCriterion((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Inovação" /><Textarea id="criterion-description" label="Descrição para o avaliador" value={newCriterion.description} onChange={(event) => setNewCriterion((current) => ({ ...current, description: event.target.value }))} placeholder="O que deve ser observado?" className="min-h-28" /><div><FieldLabel htmlFor="criterion-weight" required>Peso (%)</FieldLabel><input id="criterion-weight" type="number" min="1" max="100" value={newCriterion.weight} onChange={(event) => setNewCriterion((current) => ({ ...current, weight: event.target.value }))} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40" /></div><Button type="button" variant="secondary" className="w-full" onClick={addCriterion}><Plus className="size-4" />Adicionar à lista</Button></div></section><section className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card"><div className="flex items-center justify-between gap-3 border-b border-outline/30 px-5 py-5 sm:px-7"><div><h2 className="text-xl font-bold tracking-[-0.03em] text-ink">Critérios definidos</h2><p className="mt-1 text-xs text-ink-muted">Peso total: <strong className={totalWeight === 100 ? "text-lime-deep" : "text-danger"}>{totalWeight}%</strong></p></div><div className="w-24"><ProgressBar value={totalWeight} showLabel={false} /></div></div><div className="divide-y divide-outline/30">{criteria.map((criterion, index) => <article key={criterion.id} className="flex gap-3 px-5 py-5 sm:px-7"><div className="flex shrink-0 flex-col gap-1"><button type="button" disabled={index === 0} onClick={() => moveCriterion(index, -1)} className="rounded p-1 text-ink-muted hover:bg-surface-low disabled:opacity-30" aria-label={`Mover ${criterion.name} para cima`}><ArrowUp className="size-4" /></button><button type="button" disabled={index === criteria.length - 1} onClick={() => moveCriterion(index, 1)} className="rounded p-1 text-ink-muted hover:bg-surface-low disabled:opacity-30" aria-label={`Mover ${criterion.name} para baixo`}><ArrowDown className="size-4" /></button></div><div className="min-w-0 flex-1"><input aria-label={`Nome de ${criterion.name}`} value={criterion.name} onChange={(event) => updateCriterion(criterion.id, "name", event.target.value)} className="w-full border-0 bg-transparent p-0 text-base font-bold text-ink focus:outline-none focus:ring-0" /><textarea aria-label={`Descrição de ${criterion.name}`} value={criterion.description} onChange={(event) => updateCriterion(criterion.id, "description", event.target.value)} rows={2} className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-ink-muted focus:outline-none focus:ring-0" /></div><label className="flex h-fit shrink-0 items-center rounded-full bg-lime/25 px-2.5 py-1 text-xs font-bold text-lime-deep"><span className="sr-only">Peso de {criterion.name}</span><input aria-label={`Peso de ${criterion.name}`} type="number" min="1" max="100" value={criterion.weight} onChange={(event) => updateCriterion(criterion.id, "weight", event.target.value)} className="w-8 border-0 bg-transparent p-0 text-right text-xs font-bold text-lime-deep focus:outline-none focus:ring-0" />%</label><button type="button" onClick={() => setCriteria((current) => current.filter((item) => item.id !== criterion.id))} className="h-fit rounded p-1.5 text-ink-muted hover:bg-danger-soft hover:text-danger" aria-label={`Remover ${criterion.name}`}><Trash2 className="size-4" /></button></article>)}{!criteria.length ? <p className="px-7 py-10 text-center text-sm text-ink-muted">Nenhum critério definido.</p> : null}</div></section></div><section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7"><div className="flex items-center gap-3"><SlidersHorizontal className="size-5 text-lime-deep" /><div><h2 className="text-xl font-bold tracking-[-0.03em] text-ink">Níveis da escala</h2><p className="mt-1 text-sm text-ink-muted">Os cinco níveis são fixos; edite apenas seus textos.</p></div></div><div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">{scale.map((level) => <div key={level.value} className="rounded-md bg-surface-low p-3"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-lime">{level.value}</span><input aria-label={`Rótulo do nível ${level.value}`} value={level.label} onChange={(event) => setScale((current) => current.map((item) => item.value === level.value ? { ...item, label: event.target.value } : item))} className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-bold text-ink focus:outline-none focus:ring-0" /><input aria-label={`Descrição do nível ${level.value}`} value={level.description} onChange={(event) => setScale((current) => current.map((item) => item.value === level.value ? { ...item, description: event.target.value } : item))} className="mt-1 w-full border-0 bg-transparent p-0 text-xs text-ink-muted focus:outline-none focus:ring-0" /></div>)}</div></section></div></AppShell>;
}
