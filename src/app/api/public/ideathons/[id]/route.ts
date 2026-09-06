import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ideas, ideathons, phaseIdeas, phases, teams } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select({ id: ideathons.id, name: ideathons.name, slug: ideathons.slug, description: ideathons.description, status: ideathons.status, timezone: ideathons.timezone, startsAt: ideathons.startsAt, endsAt: ideathons.endsAt }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!event) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  const [phaseRows, ideaRows] = await Promise.all([
    db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status, startsAt: phases.startsAt, endsAt: phases.endsAt }).from(phases).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position)),
    db.select({ id: ideas.id, name: ideas.name, solution: ideas.solution, category: ideas.category, teamName: teams.name, phaseId: phaseIdeas.phaseId, phaseName: phases.name }).from(ideas).innerJoin(teams, eq(teams.id, ideas.teamId)).leftJoin(phaseIdeas, eq(phaseIdeas.ideaId, ideas.id)).leftJoin(phases, and(eq(phases.id, phaseIdeas.phaseId), eq(phases.ideathonId, id))).where(and(eq(ideas.ideathonId, id), eq(ideas.status, "ACTIVE"))).orderBy(asc(ideas.createdAt)),
  ]);
  return NextResponse.json({ data: { ...event, phases: phaseRows, ideas: ideaRows } });
}
