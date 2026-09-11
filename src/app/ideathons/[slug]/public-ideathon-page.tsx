"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type PublicIdea = {
  id: string;
  name: string;
  solution: string;
  category: string | null;
  teamName: string;
  phases: Array<{ id: string; name: string; position: number; status: string }>;
  pitchDeckUrl: string | null;
  videoPitchUrl: string | null;
  members: Array<{ name: string; role: string }>;
};

type PublicData = {
  name: string;
  description: string;
  status: string;
  timezone: string;
  startsAt: string | null;
  endsAt: string | null;
  phases: Array<{ id: string; name: string; status: string; position: number; startsAt: string | null; endsAt: string | null }>;
  ideas: PublicIdea[];
};

export function PublicIdeathonPage({ slug }: { slug: string }) {
  const [event, setEvent] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<PublicIdea | null>(null);
  const [phaseTab, setPhaseTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/ideathons/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || "Ideathon não encontrado.");
        setEvent(payload.data);
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary text-lime">
        <LoaderCircle className="size-7 animate-spin" />
      </main>
    );
  if (!event)
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6">
        <p className="rounded-md bg-danger-soft px-5 py-4 text-sm font-semibold text-danger">
          {error || "Ideathon não encontrado."}
        </p>
      </main>
    );

  const visibleIdeas = phaseTab === "all" ? event.ideas : event.ideas.filter((idea) => idea.phases.some((phase) => phase.id === phaseTab));
  const phaseStatusLabel = (status: string) => status === "CLOSED" ? "Encerrada" : status === "READY" ? "Próxima etapa" : status === "LIVE" ? "Ao vivo" : "Em breve";
  const formatPhaseWindow = (phase: PublicData["phases"][number]) => {
    if (!phase.startsAt && !phase.endsAt) return null;
    const format = new Intl.DateTimeFormat("pt-BR", { timeZone: event.timezone, dateStyle: "short", timeStyle: "short" });
    return `${phase.startsAt ? format.format(new Date(phase.startsAt)) : "Início a definir"}${phase.endsAt ? ` até ${format.format(new Date(phase.endsAt))}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <header className="border-b border-white/10 bg-primary text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex min-w-0 items-center py-2" aria-label="Revvolução, página inicial">
            <img
              src="/brand/logo-revvolucao.png"
              alt="Revvolução"
              className="h-auto w-full max-w-[10rem] object-contain object-left sm:max-w-[12rem]"
            />
          </Link>
          <Badge tone="lime">
            {event.status === "LIVE" ? "Ao vivo" : event.status}
          </Badge>
        </div>
      </header>
      <section className="bg-primary px-5 pb-20 pt-16 text-white sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-lime">
            <Sparkles className="size-4" />
            Ideathon
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.06em] sm:text-6xl">
            {event.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            {event.description ||
              "Um espaço para ideias que transformam desafios em soluções."}
          </p>
          {event.startsAt ? (
            <p className="mt-7 flex items-center gap-2 text-sm font-semibold text-white/70">
              <CalendarDays className="size-4 text-lime" />
              {new Date(event.startsAt).toLocaleDateString("pt-BR")}{" "}
              {event.endsAt
                ? `até ${new Date(event.endsAt).toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          ) : null}
        </div>
      </section>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_320px]">
        <section id="ideas">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">
                Projetos participantes
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-ink">
                Conheça as ideias
              </h2>
            </div>
            <span className="text-sm text-ink-muted">
              {visibleIdeas.length} projetos
            </span>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar equipes por fase"><button type="button" role="tab" aria-selected={phaseTab === "all"} onClick={() => setPhaseTab("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${phaseTab === "all" ? "bg-primary text-lime" : "bg-white text-ink-muted hover:bg-surface-low"}`}>Todas as equipes</button>{event.phases.map((phase) => <button key={phase.id} type="button" role="tab" aria-selected={phaseTab === phase.id} onClick={() => setPhaseTab(phase.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${phaseTab === phase.id ? "bg-primary text-lime" : "bg-white text-ink-muted hover:bg-surface-low"}`}>{phase.name}</button>)}</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleIdeas.map((idea) => (
              <article
                key={idea.id}
                className="rounded-lg border border-outline/45 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-ink">
                    {idea.name}
                  </h3>
                  {idea.category ? (
                    <span className="rounded-full bg-surface-low px-2.5 py-1 text-xs font-semibold text-ink-muted">
                      {idea.category}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  {idea.solution}
                </p>
                <div className="mt-5 border-t border-outline/30 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    {idea.teamName}
                  </p>
                  {idea.phases.length ? <p className="mt-1 text-xs text-ink-muted">{idea.phases.map((phase) => phase.name).join(" · ")}</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
                  {idea.pitchDeckUrl ? (
                    <a
                      href={idea.pitchDeckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline px-3 text-indigo-deep transition-colors hover:border-indigo hover:bg-indigo/5 hover:text-indigo"
                    >
                      <FileText className="size-4" />
                      Pitch deck
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                  {idea.videoPitchUrl ? (
                    <a
                      href={idea.videoPitchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline px-3 text-indigo-deep transition-colors hover:border-indigo hover:bg-indigo/5 hover:text-indigo"
                    >
                      <PlayCircle className="size-4" />
                      Vídeo pitch
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedIdea(idea)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline px-3 text-lime-deep transition-colors hover:border-lime-deep hover:bg-lime/10"
                  >
                    <Users className="size-4" />
                    Equipe ({idea.members.length})
                  </button>
                </div>
              </article>
            ))}
            {!visibleIdeas.length ? (
              <p className="col-span-full rounded-lg bg-white p-10 text-center text-sm text-ink-muted">
                Os projetos serão publicados quando estiverem disponíveis.
              </p>
            ) : null}
          </div>
        </section>
        <aside className="self-start rounded-2xl bg-black p-6 text-white shadow-card lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
            Cronograma
          </p>
          <ol className="mt-6 space-y-5">
            {event.phases.map((phase) => (
              <li key={phase.id} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-lime" />
                <div>
                  <p className="text-base font-bold text-white">{phase.name}</p>
                  <p className="mt-0.5 text-sm text-white/55">
                    {formatPhaseWindow(phase) || phaseStatusLabel(phase.status)}
                  </p>
                  {formatPhaseWindow(phase) ? <p className="mt-1 text-xs text-white/40">{phaseStatusLabel(phase.status)}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          {event.phases.length === 0 ? (
            <p className="mt-5 text-sm text-white/55">
              As fases serão divulgadas em breve.
            </p>
          ) : null}
        </aside>
      </div>
      <Modal
        open={Boolean(selectedIdea)}
        onClose={() => setSelectedIdea(null)}
        title={selectedIdea ? `Equipe ${selectedIdea.teamName}` : "Equipe"}
      >
        {selectedIdea?.members.length ? (
          <ul className="space-y-3">
            {selectedIdea.members.map((member) => (
              <li
                key={`${member.name}-${member.role}`}
                className="rounded-md bg-surface-low px-4 py-3"
              >
                <p className="text-sm font-bold text-ink">{member.name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{member.role}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">
            Nenhum integrante foi informado para esta equipe.
          </p>
        )}
      </Modal>
    </main>
  );
}
