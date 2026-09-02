"use client";

import { useState } from "react";
import {
  ChevronRight,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { FieldLabel, FieldMessage, Input, Textarea } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";

type Criterion = {
  id: number;
  name: string;
  description: string;
  weight: number;
};

type ScaleLevel = {
  value: number;
  label: string;
  description: string;
};

const initialCriteria: Criterion[] = [
  {
    id: 1,
    name: "Inovação e Criatividade",
    description: "A solução propõe uma abordagem nova ou significativamente melhorada em relação às alternativas existentes no mercado?",
    weight: 30,
  },
  {
    id: 2,
    name: "Viabilidade Técnica e Econômica",
    description: "O projeto é tecnicamente possível de ser desenvolvido no prazo proposto e possui um modelo de negócios sustentável?",
    weight: 25,
  },
  {
    id: 3,
    name: "Impacto Social/Ambiental",
    description: "Qual o potencial da solução para gerar impacto positivo real e mensurável para a sociedade ou meio ambiente?",
    weight: 20,
  },
];

const initialScale: ScaleLevel[] = [
  { value: 1, label: "Fraco", description: "Muito abaixo" },
  { value: 2, label: "2", description: "Abaixo" },
  { value: 3, label: "3", description: "Adequado" },
  { value: 4, label: "4", description: "Muito bom" },
  { value: 5, label: "Excelente", description: "Referência" },
];

export default function EvaluationConfigurationPage() {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [scale, setScale] = useState(initialScale);
  const [selectedScale, setSelectedScale] = useState(3);
  const [newCriterion, setNewCriterion] = useState({ name: "", description: "", weight: "" });
  const [formError, setFormError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const totalWeight = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  const weightIsValid = totalWeight === 100;

  function updateCriterion(id: number, field: "name" | "description" | "weight", value: string) {
    setCriteria((current) => current.map((criterion) => {
      if (criterion.id !== id) return criterion;
      if (field === "weight") return { ...criterion, weight: Number(value) || 0 };
      return { ...criterion, [field]: value };
    }));
    setSaveState("idle");
    setSaveError("");
  }

  function addCriterion() {
    const weight = Number(newCriterion.weight);
    if (!newCriterion.name.trim() || !newCriterion.description.trim() || !weight) {
      setFormError("Preencha o nome, a descrição e um peso válido para adicionar o critério.");
      return;
    }

    setCriteria((current) => [...current, {
      id: Date.now(),
      name: newCriterion.name.trim(),
      description: newCriterion.description.trim(),
      weight,
    }]);
    setNewCriterion({ name: "", description: "", weight: "" });
    setFormError("");
    setSaveState("idle");
    setSaveError("");
  }

  function removeCriterion(id: number) {
    setCriteria((current) => current.filter((criterion) => criterion.id !== id));
    setSaveState("idle");
    setSaveError("");
  }

  function updateScale(value: number, field: "label" | "description", text: string) {
    setScale((current) => current.map((level) => level.value === value ? { ...level, [field]: text } : level));
    setSaveState("idle");
    setSaveError("");
  }

  function handleSave() {
    if (!weightIsValid) {
      setSaveError("Ajuste os pesos até que a soma total seja exatamente 100%.");
      return;
    }
    setSaveError("");
    setSaveState("saved");
  }

  function handleDiscard() {
    setCriteria(initialCriteria);
    setScale(initialScale);
    setNewCriterion({ name: "", description: "", weight: "" });
    setFormError("");
    setSaveError("");
    setSaveState("idle");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-container space-y-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <a href="/admin" className="transition-colors hover:text-ink">Eventos</a>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="truncate">Hackathon Sustentabilidade 2024</span>
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.05em] text-ink sm:text-4xl">Configuração de Avaliação</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">Defina os critérios que os jurados usarão para avaliar os projetos. A avaliação final será baseada em uma <strong className="font-bold text-ink">Escala Likert (1 a 5)</strong>, multiplicada pelo peso de cada critério.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" onClick={handleDiscard}><RotateCcw className="size-4" />Descartar</Button>
            <Button type="button" onClick={handleSave}><Save className="size-4" />{saveState === "saved" ? "Configurações salvas" : "Salvar configurações"}</Button>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)]">
          <section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="add-criterion-title">
            <div className="mb-7 flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-lime-deep text-lime-deep"><Plus className="size-5" /></span>
              <h2 id="add-criterion-title" className="text-xl font-bold tracking-[-0.03em] text-ink">Adicionar Critério</h2>
            </div>
            <div className="space-y-5">
              <Input
                id="criterion-name"
                label="Nome do Critério"
                required
                value={newCriterion.name}
                onChange={(event) => setNewCriterion((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Inovação, Viabilidade..."
              />
              <Textarea
                id="criterion-description"
                label="Descrição (Guia para o Jurado)"
                value={newCriterion.description}
                onChange={(event) => setNewCriterion((current) => ({ ...current, description: event.target.value }))}
                placeholder="Explique o que o jurado deve observar neste critério..."
                className="min-h-28"
              />
              <div>
                <FieldLabel htmlFor="criterion-weight" required>Peso (%)</FieldLabel>
                <div className="relative">
                  <input
                    id="criterion-weight"
                    type="number"
                    min="1"
                    max="100"
                    value={newCriterion.weight}
                    onChange={(event) => setNewCriterion((current) => ({ ...current, weight: event.target.value }))}
                    placeholder="25"
                    className="min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 pr-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink">%</span>
                </div>
                <FieldMessage description="A soma total dos pesos deve ser 100%." />
              </div>
              {formError ? <p className="rounded-md bg-danger-soft/60 px-3 py-2 text-xs font-semibold text-danger" role="alert">{formError}</p> : null}
              <Button type="button" variant="secondary" className="mt-1 w-full border-ink py-2.5" onClick={addCriterion}><Plus className="size-4" />Adicionar à lista</Button>
            </div>
          </section>

          <div className="space-y-5">
            <section className="overflow-hidden rounded-lg bg-primary p-5 text-white shadow-card sm:p-7" aria-labelledby="likert-preview-title">
              <div className="relative">
                <div className="mb-1 flex items-center gap-3 text-lime">
                  <SlidersHorizontal className="size-6" />
                  <h2 id="likert-preview-title" className="text-xl font-bold tracking-[-0.03em]">Sistema de Avaliação: Escala Likert</h2>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-white/70">Para cada critério, os jurados atribuirão uma nota de 1 (Muito Fraco) a 5 (Excelente). O sistema calculará a nota final automaticamente baseada nos pesos.</p>
                <div className="mt-6 rounded-md border border-white/10 bg-white/[0.07] p-5 sm:p-7">
                  <p className="text-center text-sm font-bold sm:text-base">Exemplo: Como você avalia a viabilidade deste projeto?</p>
                  <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-4">
                    {scale.map((level, index) => {
                      const selected = selectedScale === level.value;
                      return (
                        <button
                          type="button"
                          key={level.value}
                          onClick={() => setSelectedScale(level.value)}
                          className="group relative flex flex-col items-center gap-2 text-center focus-visible:outline-none"
                          aria-label={`${level.value}: ${level.label}. ${level.description}`}
                        >
                          <span className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition-all sm:size-9 ${selected ? "border-lime bg-lime text-lime-foreground shadow-[0_0_0_5px_rgba(212,255,111,0.13)]" : "border-white/50 text-white group-hover:border-lime group-hover:text-lime"}`}>
                            {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
                          </span>
                          {index < scale.length - 1 ? <span className="absolute left-[calc(50%+21px)] right-[calc(-50%-9px)] top-4 hidden h-px bg-white/15 sm:block" aria-hidden="true" /> : null}
                          <span className={`relative text-[10px] font-semibold sm:text-xs ${selected ? "text-lime" : "text-white/70"}`}>{level.value}. {level.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card" aria-labelledby="criteria-list-title">
              <div className="flex flex-col gap-3 border-b border-outline/30 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <h2 id="criteria-list-title" className="text-xl font-bold tracking-[-0.03em] text-ink">Critérios Definidos</h2>
                  <p className="mt-1 text-xs text-ink-muted">Defina a ordem e o peso de cada critério</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink-muted">
                  <span>Peso total:</span>
                  <div className="w-24 sm:w-32"><ProgressBar value={totalWeight} showLabel={false} /></div>
                  <span className={`font-bold ${weightIsValid ? "text-lime-deep" : totalWeight > 100 ? "text-danger" : "text-ink"}`}>{totalWeight}%</span>
                </div>
              </div>
              {saveError ? <p className="border-b border-danger/20 bg-danger-soft/30 px-5 py-3 text-xs font-semibold text-danger sm:px-7" role="alert">{saveError}</p> : null}
              <div className="divide-y divide-outline/30">
                {criteria.map((criterion) => (
                  <article key={criterion.id} className="group flex gap-3 px-4 py-5 sm:px-7">
                    <button type="button" className="mt-1 hidden cursor-grab text-outline transition-colors hover:text-ink sm:block" aria-label={`Reordenar ${criterion.name}`}><GripVertical className="size-5" /></button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`criterion-${criterion.id}-name`} className="sr-only">Nome do critério</label>
                          <input id={`criterion-${criterion.id}-name`} value={criterion.name} onChange={(event) => updateCriterion(criterion.id, "name", event.target.value)} className="w-full border-0 bg-transparent p-0 text-base font-bold text-ink focus:outline-none focus:ring-0" />
                        </div>
                        <label className="flex shrink-0 items-center rounded-full bg-lime/25 px-2.5 py-1 text-xs font-bold text-lime-deep">
                          <span className="sr-only">Peso de </span>
                          <input aria-label={`Peso de ${criterion.name}`} type="number" min="0" max="100" value={criterion.weight} onChange={(event) => updateCriterion(criterion.id, "weight", event.target.value)} className="w-8 border-0 bg-transparent p-0 text-right text-xs font-bold text-lime-deep focus:outline-none focus:ring-0" />%
                        </label>
                      </div>
                      <label htmlFor={`criterion-${criterion.id}-description`} className="sr-only">Descrição do critério</label>
                      <textarea id={`criterion-${criterion.id}-description`} value={criterion.description} onChange={(event) => updateCriterion(criterion.id, "description", event.target.value)} rows={2} className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-ink-muted focus:outline-none focus:ring-0" />
                    </div>
                    <button type="button" onClick={() => removeCriterion(criterion.id)} className="mt-1 self-start rounded-md p-1.5 text-ink-muted opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100 focus:opacity-100" aria-label={`Remover ${criterion.name}`}><Trash2 className="size-4" /></button>
                  </article>
                ))}
                {criteria.length === 0 ? <p className="px-7 py-10 text-center text-sm text-ink-muted">Nenhum critério definido. Adicione o primeiro usando o formulário ao lado.</p> : null}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="scale-labels-title">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 id="scale-labels-title" className="text-xl font-bold tracking-[-0.03em] text-ink">Personalizar níveis da escala</h2>
              <p className="mt-1 text-sm text-ink-muted">Edite os rótulos e as descrições que serão exibidos aos jurados.</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">5 níveis fixos</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {scale.map((level) => (
              <div key={level.value} className="rounded-md bg-surface-low p-3">
                <span className="mb-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-lime">{level.value}</span>
                <label htmlFor={`scale-label-${level.value}`} className="sr-only">Rótulo do nível {level.value}</label>
                <input id={`scale-label-${level.value}`} value={level.label} onChange={(event) => updateScale(level.value, "label", event.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-bold text-ink focus:outline-none focus:ring-0" />
                <label htmlFor={`scale-description-${level.value}`} className="sr-only">Descrição do nível {level.value}</label>
                <input id={`scale-description-${level.value}`} value={level.description} onChange={(event) => updateScale(level.value, "description", event.target.value)} className="mt-1 w-full border-0 bg-transparent p-0 text-xs text-ink-muted focus:outline-none focus:ring-0" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
