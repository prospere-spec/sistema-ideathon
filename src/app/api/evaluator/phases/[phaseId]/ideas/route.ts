import { NextResponse } from "next/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { ideas, phaseIdeas, phases, roomEvaluators, rooms, teams } from "@/db/schema";
import { requireEvaluatorApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoEvaluatorIdeas } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ phaseId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireEvaluatorApi();
  if (response) return response;
  const { phaseId } = await params;
  if (isDemoMode) {
    const data = getDemoEvaluatorIdeas(phaseId, user.id);
    return data ? NextResponse.json(data) : NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  }
  const db = getDb();

  const [phase] = await db.select({ id: phases.id, ideathonId: phases.ideathonId, name: phases.name, status: phases.status }).from(phases).where(eq(phases.id, phaseId)).limit(1);
  if (!phase) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  if (phase.status !== "LIVE") return NextResponse.json({ error: "A fase não está disponível para avaliação." }, { status: 409 });

  const data = await db
    .select({
      phaseIdeaId: phaseIdeas.id,
      ideaId: ideas.id,
      name: ideas.name,
      problem: ideas.problem,
      solution: ideas.solution,
      audience: ideas.audience,
      differentiation: ideas.differentiation,
      category: ideas.category,
      pitchDeckUrl: ideas.pitchDeckUrl,
      videoPitchUrl: ideas.videoPitchUrl,
      websiteUrl: ideas.websiteUrl,
      teamId: teams.id,
      teamName: teams.name,
      roomId: rooms.id,
      roomName: rooms.name,
      roomStatus: rooms.status,
      participationStatus: phaseIdeas.status,
    })
    .from(phaseIdeas)
    .innerJoin(ideas, eq(ideas.id, phaseIdeas.ideaId))
    .innerJoin(teams, eq(teams.id, ideas.teamId))
    .innerJoin(rooms, and(eq(rooms.id, phaseIdeas.roomId), eq(rooms.phaseId, phaseId)))
    .innerJoin(roomEvaluators, and(eq(roomEvaluators.roomId, rooms.id), eq(roomEvaluators.evaluatorId, user.id)))
    .where(and(eq(phaseIdeas.phaseId, phaseId), ne(phaseIdeas.status, "ELIMINATED"), eq(ideas.status, "ACTIVE"), eq(rooms.status, "LIVE")))
    .orderBy(asc(rooms.position), asc(phaseIdeas.createdAt));

  return NextResponse.json({ phase, data });
}
