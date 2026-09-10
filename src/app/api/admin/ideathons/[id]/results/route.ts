import { NextResponse } from "next/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { evaluationCriteria, evaluationScores, evaluations, ideas, phaseIdeas, phases, roomEvaluators, rooms, teams } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import type { RankingEvaluation } from "@/lib/ranking";
import { buildRankingResults } from "@/lib/ranking-results";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoResults } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const queryPhaseId = new URL(request.url).searchParams.get("phaseId");
  if (isDemoMode) {
    const result = getDemoResults(id, queryPhaseId);
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json(result);
  }
  const db = getDb();

  const phaseRows = await db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status }).from(phases).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position));
  if (!phaseRows.length) return NextResponse.json({ error: "Nenhuma fase encontrada neste ideathon." }, { status: 404 });
  const phase = (queryPhaseId && phaseRows.find((item) => item.id === queryPhaseId)) || phaseRows.find((item) => item.status === "LIVE") || phaseRows[0];
  if (queryPhaseId && !phaseRows.some((item) => item.id === queryPhaseId)) return NextResponse.json({ error: "Fase não encontrada neste ideathon." }, { status: 404 });

  const [ideaRows, evaluatorRows, evaluationRows, roomRows] = await Promise.all([
    db.select({ phaseIdeaId: phaseIdeas.id, ideaId: ideas.id, ideaName: ideas.name, teamName: teams.name, category: ideas.category, roomId: phaseIdeas.roomId, roomName: rooms.name }).from(phaseIdeas).innerJoin(ideas, eq(ideas.id, phaseIdeas.ideaId)).innerJoin(teams, eq(teams.id, ideas.teamId)).leftJoin(rooms, eq(rooms.id, phaseIdeas.roomId)).where(and(eq(phaseIdeas.phaseId, phase.id), ne(phaseIdeas.status, "ELIMINATED"), eq(ideas.status, "ACTIVE"))).orderBy(asc(phaseIdeas.createdAt)),
    db.select({ roomId: roomEvaluators.roomId, evaluatorId: roomEvaluators.evaluatorId }).from(roomEvaluators).innerJoin(rooms, eq(rooms.id, roomEvaluators.roomId)).where(eq(rooms.phaseId, phase.id)),
    db.select({ evaluationId: evaluations.id, phaseIdeaId: evaluations.phaseIdeaId, finalScore: evaluations.finalScore, submittedAt: evaluations.submittedAt, criterionId: evaluationScores.criterionId, criterionName: evaluationCriteria.name, score: evaluationScores.score }).from(evaluations).innerJoin(phaseIdeas, eq(phaseIdeas.id, evaluations.phaseIdeaId)).innerJoin(evaluationScores, eq(evaluationScores.evaluationId, evaluations.id)).innerJoin(evaluationCriteria, eq(evaluationCriteria.id, evaluationScores.criterionId)).where(and(eq(phaseIdeas.phaseId, phase.id), eq(evaluations.status, "SUBMITTED"))),
    db.select({ id: rooms.id, name: rooms.name }).from(rooms).where(eq(rooms.phaseId, phase.id)).orderBy(asc(rooms.position), asc(rooms.id)),
  ]);

  const expectedByRoom = new Map<string, number>();
  for (const evaluator of evaluatorRows) expectedByRoom.set(evaluator.roomId, (expectedByRoom.get(evaluator.roomId) || 0) + 1);
  const evaluationsByIdea = new Map<string, Map<string, RankingEvaluation>>();
  for (const row of evaluationRows) {
    const ideaEvaluations = evaluationsByIdea.get(row.phaseIdeaId) || new Map<string, RankingEvaluation>();
    const evaluation = ideaEvaluations.get(row.evaluationId) || { finalScore: row.finalScore, submittedAt: row.submittedAt, scores: [] };
    evaluation.scores.push({ criterionId: row.criterionId, criterionName: row.criterionName, score: row.score });
    ideaEvaluations.set(row.evaluationId, evaluation);
    evaluationsByIdea.set(row.phaseIdeaId, ideaEvaluations);
  }

  const results = buildRankingResults(ideaRows.map((idea) => ({
    ideaId: idea.ideaId,
    ideaName: idea.ideaName,
    teamName: idea.teamName,
    category: idea.category,
    roomId: idea.roomId,
    roomName: idea.roomName,
    expectedEvaluations: idea.roomId ? expectedByRoom.get(idea.roomId) || 0 : 0,
    evaluations: Array.from(evaluationsByIdea.get(idea.phaseIdeaId)?.values() || []),
  })), roomRows);

  return NextResponse.json({
    phase,
    phases: phaseRows,
    ...results,
  });
}
