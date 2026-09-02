"use client";

import { useState, type FormEvent } from "react";
import { Download, Expand, List, Save, Send, Type } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Criterion = {
  id: string;
  name: string;
  question: string;
};

const criteria: Criterion[] = [
  {
    id: "innovation",
    name: "Inovação e Originalidade",
    question: "O quão disruptiva e única é a solução proposta em relação ao mercado atual?",
  },
  {
    id: "technical-feasibility",
    name: "Viabilidade Técnica",
    question: "A equipe possui capacidade técnica e clareza para desenvolver a solução no prazo?",
  },
  {
    id: "impact",
    name: "Impacto Social e Ambiental",
    question: "Qual o potencial da solução para gerar impacto positivo real e mensurável?",
  },
  {
    id: "scalability",
    name: "Escalabilidade",
    question: "A proposta pode crescer e ser replicada sem perder sua eficiência?",
  },
  {
    id: "clarity",
    name: "Clareza da Solução",
    question: "A ideia está bem estruturada e é compreensível para os públicos envolvidos?",
  },
];

const scaleLabels = ["1", "2", "3", "4", "5"];

function ScoreRail({ name, value, onChange }: { name: string; value?: number; onChange: (value: number) => void }) {
  return (
    <div className="relative rounded-md bg-surface-low px-5 py-2.5 sm:px-7">
      <div className="absolute left-7 right-7 top-1/2 h-0.5 -translate-y-1/2 bg-outline/40 sm:left-10 sm:right-10" aria-hidden="true" />
      <div className="relative grid grid-cols-5 items-center justify-between">
        {scaleLabels.map((label) => {
          const score = Number(label);
          const selected = value === score;
          return (
            <button
              key={label}
              type="button"
              name={name}
              aria-label={`Nota ${score}`}
              aria-pressed={selected}
              onClick={() => onChange(score)}
              className={`mx-auto flex size-10 items-center justify-center rounded-full border-2 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 ${selected ? "border-primary bg-primary text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]" : "border-outline bg-white text-ink hover:-translate-y-0.5 hover:border-ink"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EvaluatorVotingPage() {
  const [scores, setScores] = useState<Record<string, number>>({ innovation: 3 });
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");

  const answered = Object.keys(scores).length;
  const progress = Math.round((answered / criteria.length) * 100);
  const allCriteriaAnswered = answered === criteria.length;

  function setScore(id: string, value: number) {
    setScores((current) => ({ ...current, [id]: value }));
    setNotice("");
  }

  function saveDraft() {
    setNotice("Rascunho salvo localmente.");
  }

  function submitEvaluation(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!allCriteriaAnswered) {
      setNotice("Responda todos os critérios antes de enviar a avaliação.");
      return;
    }
    setNotice("Avaliação enviada com sucesso.");
  }

  return (
    <AppShell activeSection="reports">
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge tone="lime" className="rounded-sm px-2.5 py-1 uppercase tracking-[0.1em]">Evaluating</Badge>
              <span className="text-sm font-semibold text-ink-muted">Ideia 3 de 15</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">Painel do Avaliador - EcoSync</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-ink-muted">Plataforma de sincronização de logística reversa para pequenos comércios locais, utilizando IA para otimizar rotas de coleta de recicláveis.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:pb-1">
            <div className="mr-1 flex items-center gap-2 text-sm text-ink-muted"><span className="size-2.5 rounded-full bg-indigo-deep" />Progresso: {progress}%</div>
            <Button type="button" variant="secondary" onClick={saveDraft}><Save className="size-4" />Save Draft</Button>
            <Button type="button" onClick={() => submitEvaluation()}><Send className="size-4" />Enviar Avaliação</Button>
          </div>
        </section>

        {notice ? <p className={`rounded-md px-4 py-3 text-sm font-semibold ${notice.includes("sucesso") || notice.includes("salvo") ? "bg-lime/30 text-lime-deep" : "bg-danger-soft/60 text-danger"}`} role="status">{notice}</p> : null}

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(330px,0.34fr)_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-card">
            <div className="relative h-56 overflow-hidden bg-[#dfe8e7]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(212,255,111,0.78),transparent_12%),radial-gradient(circle_at_42%_55%,rgba(27,141,143,0.72),transparent_21%),linear-gradient(135deg,#f1f4ef_0%,#b8d3ce_42%,#396f85_70%,#e6ece5_100%)] opacity-90" />
              <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 600 300" fill="none" aria-hidden="true">
                <path d="M62 212C139 132 198 183 254 113S373 65 431 128s84-19 117-64" stroke="#d4ff6f" strokeWidth="4" />
                <path d="M52 248C139 190 176 226 249 153s101-19 148 13 102-41 145-69" stroke="#2b6f87" strokeWidth="3" />
                <path d="M104 91c73 45 106-14 165 47s114-12 179 42 96 15 132-31" stroke="#75bca3" strokeWidth="2" />
                {[{ x: 104, y: 169 }, { x: 178, y: 174 }, { x: 254, y: 113 }, { x: 341, y: 92 }, { x: 431, y: 128 }, { x: 504, y: 95 }].map((point) => <g key={`${point.x}-${point.y}`}><circle cx={point.x} cy={point.y} r="7" fill="#d4ff6f" /><circle cx={point.x} cy={point.y} r="14" stroke="#d4ff6f" strokeOpacity=".35" /></g>)}
              </svg>
              <button type="button" className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-white/45 text-white backdrop-blur-sm transition-colors hover:bg-primary" aria-label="Expandir imagem"><Expand className="size-5" /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Project Overview</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm text-ink-muted">Equipe</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex -space-x-2" aria-hidden="true"><span className="size-7 rounded-full border-2 border-white bg-surface-high" /><span className="size-7 rounded-full border-2 border-white bg-primary-container" /><span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-surface-high text-[10px] font-bold text-ink-muted">+2</span></span>
                    <span className="text-base font-medium text-ink">TechRoots (4 members)</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Categoria</p>
                  <span className="mt-2 inline-flex rounded-full bg-surface-container px-3 py-1.5 text-sm font-medium text-ink">Smart Cities</span>
                </div>
              </div>
              <div className="mt-5 border-t border-outline/30 pt-5">
                <a href="#pitch-deck" className="inline-flex items-center gap-2 text-base font-medium text-indigo-deep transition-colors hover:text-indigo"><Download className="size-4" />Baixar Pitch Deck (PDF)</a>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="evaluation-criteria-title">
              <div className="flex items-center justify-between gap-4 border-b border-outline/30 pb-5">
                <h2 id="evaluation-criteria-title" className="text-xl font-medium tracking-[-0.03em] text-ink">Critérios de Avaliação</h2>
                <span className="text-sm text-ink-muted sm:text-base">1 = Insatisfatório, 5 = Excelente</span>
              </div>
              <form onSubmit={submitEvaluation} className="divide-y divide-outline/30">
                {criteria.map((criterion) => (
                  <fieldset key={criterion.id} className="border-0 py-6 first:pt-7 last:pb-1">
                    <legend className="w-full">
                      <span className="block text-base font-medium text-ink sm:text-lg">{criterion.name}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink sm:text-base">{criterion.question}</span>
                    </legend>
                    <div className="mt-5"><ScoreRail name={criterion.id} value={scores[criterion.id]} onChange={(value) => setScore(criterion.id, value)} /></div>
                  </fieldset>
                ))}
              </form>
            </section>

            <section className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card sm:p-7" aria-labelledby="feedback-title">
              <h2 id="feedback-title" className="text-xl font-medium tracking-[-0.03em] text-ink">Comentários / Feedback</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">Seu feedback detalhado é valioso para a equipe. Destaque pontos fortes e áreas de melhoria.</p>
              <div className="relative mt-5">
                <label htmlFor="feedback" className="sr-only">Escreva suas observações</label>
                <textarea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Escreva suas observações aqui..." className="min-h-48 w-full resize-y rounded-md border border-outline/50 bg-surface-low px-5 py-4 pb-12 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" />
                <div className="absolute bottom-3 right-4 flex items-center gap-2 text-ink-muted"><button type="button" className="rounded p-1.5 hover:bg-surface-container" aria-label="Negrito"><Type className="size-4" /></button><button type="button" className="rounded p-1.5 hover:bg-surface-container" aria-label="Lista"><List className="size-4" /></button></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
