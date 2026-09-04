import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/db";
import { ideas, ideathons, phaseIdeas, phases, roomEvaluators, rooms, teams } from "@/db/schema";
import { requireRole } from "@/lib/auth-guards";

export default async function EvaluatorHomePage() {
  const user = await requireRole("EVALUATOR");
  const db = getDb();
  const assignments = await db.select({ ideathonId: ideathons.id, ideathonName: ideathons.name, phaseId: phases.id, phaseName: phases.name, ideaId: ideas.id, ideaName: ideas.name, teamName: teams.name, roomName: rooms.name }).from(roomEvaluators).innerJoin(rooms, eq(rooms.id, roomEvaluators.roomId)).innerJoin(phases, and(eq(phases.id, rooms.phaseId), eq(phases.status, "LIVE"))).innerJoin(ideathons, eq(ideathons.id, phases.ideathonId)).innerJoin(phaseIdeas, eq(phaseIdeas.roomId, rooms.id)).innerJoin(ideas, and(eq(ideas.id, phaseIdeas.ideaId), eq(ideas.status, "ACTIVE"))).innerJoin(teams, eq(teams.id, ideas.teamId)).where(and(eq(roomEvaluators.evaluatorId, user.id), eq(rooms.status, "LIVE"))).orderBy(asc(phases.position), asc(rooms.position), asc(phaseIdeas.createdAt));
  const groups = new Map<string, { ideathonId: string; ideathonName: string; phaseId: string; phaseName: string; ideas: typeof assignments }>();
  for (const assignment of assignments) {
    const key = `${assignment.ideathonId}:${assignment.phaseId}`;
    const group = groups.get(key) || { ideathonId: assignment.ideathonId, ideathonName: assignment.ideathonName, phaseId: assignment.phaseId, phaseName: assignment.phaseName, ideas: [] };
    group.ideas.push(assignment);
    groups.set(key, group);
  }

  return <AppShell navigation="evaluator" activeSection="ideathons"><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-deep">Área do avaliador</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">Olá, {user.name}</h1><p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">Selecione uma ideia atribuída à sua sala para iniciar ou continuar a avaliação.</p></section>{groups.size ? <div className="space-y-5">{Array.from(groups.values()).map((group) => <section key={`${group.ideathonId}:${group.phaseId}`} className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7"><div className="flex flex-col justify-between gap-3 border-b border-outline/30 pb-5 sm:flex-row sm:items-start"><div><Badge tone="lime">Fase ao vivo</Badge><h2 className="mt-3 text-xl font-bold tracking-[-0.03em] text-ink">{group.ideathonName}</h2><p className="mt-1 text-sm text-ink-muted">{group.phaseName}</p></div><span className="text-sm font-semibold text-ink-muted">{group.ideas.length} {group.ideas.length === 1 ? "ideia" : "ideias"}</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{group.ideas.map((idea) => <Link key={idea.ideaId} href={`/avaliador/ideathons/${group.ideathonId}/ideias/${idea.ideaId}?phaseId=${group.phaseId}`} className="rounded-md border border-outline/45 bg-surface-low p-4 transition-colors hover:border-lime hover:bg-lime/10"><p className="font-bold text-ink">{idea.ideaName}</p><p className="mt-1 text-sm text-ink-muted">{idea.teamName} · {idea.roomName}</p><span className="mt-4 inline-flex text-sm font-bold text-lime-deep">Avaliar ideia -></span></Link>)}</div></section>)}</div> : <section className="rounded-lg border border-black/[0.04] bg-white p-8 shadow-card"><p className="text-base font-semibold text-ink">Nenhuma ideia disponível agora.</p><p className="mt-2 text-sm leading-6 text-ink-muted">Suas salas e ideias atribuídas aparecerão aqui quando uma fase e uma sala estiverem ao vivo.</p></section>}</div></AppShell>;
}
