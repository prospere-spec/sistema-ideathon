import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { evaluationConfigs, evaluationCriteria, evaluationScores, evaluations, auditLogs, phaseIdeas, phases, roomEvaluators, rooms } from "@/db/schema";
import { requireEvaluatorApi } from "@/lib/api-auth";
import { calculateWeightedScore } from "@/lib/evaluation-score";
import { isDemoMode } from "@/lib/demo-mode";
import { submitDemoEvaluation } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

type SubmitPayload = {
  scores: Array<{ criterionId: string; score: number }>;
  feedback: string | null;
};

function parseSubmitPayload(input: unknown): { data: SubmitPayload } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Envie uma avaliação válida." };

  const body = input as Record<string, unknown>;
  if (!Array.isArray(body.scores)) return { error: "Envie uma nota para cada critério." };

  const scores: SubmitPayload["scores"] = [];
  for (const rawScore of body.scores) {
    if (!rawScore || typeof rawScore !== "object") return { error: "Há uma nota inválida na avaliação." };
    const score = rawScore as Record<string, unknown>;
    const criterionId = String(score.criterionId ?? "").trim();
    if (!criterionId || typeof score.score !== "number") return { error: "Cada nota precisa de um critério e um valor." };
    scores.push({ criterionId, score: score.score });
  }

  if (body.feedback !== undefined && body.feedback !== null && typeof body.feedback !== "string") {
    return { error: "O feedback informado é inválido." };
  }

  const feedback = typeof body.feedback === "string" ? body.feedback.trim() || null : null;
  if (feedback && feedback.length > 5000) return { error: "O feedback deve ter no máximo 5000 caracteres." };

  return { data: { scores, feedback } };
}

export async function POST(request: Request, { params }: RouteContext) {
  const { user, response } = await requireEvaluatorApi();
  if (response) return response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const parsed = parseSubmitPayload(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (isDemoMode) {
    const outcome = submitDemoEvaluation(id, user.id, parsed.data);
    return "error" in outcome ? NextResponse.json({ error: outcome.error }, { status: outcome.status }) : NextResponse.json(outcome);
  }

  const db = getDb();
  try {
    const outcome = await db.transaction(async (tx) => {
      const [evaluation] = await tx
        .select({
          id: evaluations.id,
          evaluatorId: evaluations.evaluatorId,
          phaseIdeaId: evaluations.phaseIdeaId,
          roomId: evaluations.roomId,
          evaluationConfigId: evaluations.evaluationConfigId,
          status: evaluations.status,
          feedback: evaluations.feedback,
          finalScore: evaluations.finalScore,
          submittedAt: evaluations.submittedAt,
          phaseId: phases.id,
          ideathonId: phases.ideathonId,
          phaseStatus: phases.status,
          phaseIdeaRoomId: phaseIdeas.roomId,
          roomPhaseId: rooms.phaseId,
          roomStatus: rooms.status,
          configPhaseId: evaluationConfigs.phaseId,
          configStatus: evaluationConfigs.status,
        })
        .from(evaluations)
        .innerJoin(phaseIdeas, eq(phaseIdeas.id, evaluations.phaseIdeaId))
        .innerJoin(phases, eq(phases.id, phaseIdeas.phaseId))
        .innerJoin(rooms, eq(rooms.id, evaluations.roomId))
        .innerJoin(evaluationConfigs, eq(evaluationConfigs.id, evaluations.evaluationConfigId))
        .where(eq(evaluations.id, id))
        .for("update");

      if (!evaluation) return { status: 404, error: "Avaliação não encontrada." };
      if (evaluation.evaluatorId !== user.id) return { status: 403, error: "Você não pode enviar esta avaliação." };

      const persistedScores = async () => tx
        .select({ criterionId: evaluationScores.criterionId, score: evaluationScores.score })
        .from(evaluationScores)
        .where(eq(evaluationScores.evaluationId, evaluation.id))
        .orderBy(asc(evaluationScores.criterionId));

      if (evaluation.status === "SUBMITTED") {
        return {
          data: {
            id: evaluation.id,
            status: evaluation.status,
            feedback: evaluation.feedback,
            finalScore: evaluation.finalScore,
            submittedAt: evaluation.submittedAt,
            scores: await persistedScores(),
            idempotent: true,
          },
        };
      }

      if (evaluation.status !== "DRAFT") return { status: 409, error: "A avaliação não está disponível para envio." };
      if (evaluation.phaseStatus !== "LIVE") return { status: 409, error: "A fase não está recebendo avaliações." };
      if (evaluation.roomStatus !== "LIVE") return { status: 409, error: "A sala não está recebendo avaliações." };
      if (evaluation.roomPhaseId !== evaluation.phaseId || evaluation.phaseIdeaRoomId !== evaluation.roomId) {
        return { status: 409, error: "A avaliação não está vinculada corretamente à sala da fase." };
      }
      if (evaluation.configPhaseId !== evaluation.phaseId || (evaluation.configStatus !== "PUBLISHED" && evaluation.configStatus !== "LOCKED")) {
        return { status: 409, error: "A configuração da avaliação não está disponível." };
      }

      const [assignment] = await tx
        .select({ roomId: roomEvaluators.roomId })
        .from(roomEvaluators)
        .where(and(eq(roomEvaluators.roomId, evaluation.roomId), eq(roomEvaluators.evaluatorId, user.id)))
        .limit(1);
      if (!assignment) return { status: 403, error: "Você não está alocado nesta sala." };

      const criteria = await tx
        .select({ id: evaluationCriteria.id, weight: evaluationCriteria.weight })
        .from(evaluationCriteria)
        .where(eq(evaluationCriteria.evaluationConfigId, evaluation.evaluationConfigId))
        .orderBy(asc(evaluationCriteria.position));

      if (parsed.data.scores.length !== criteria.length) {
        return { status: 422, error: "Envie exatamente uma nota para cada critério." };
      }

      const criterionById = new Map(criteria.map((criterion) => [criterion.id, criterion]));
      const seenCriteria = new Set<string>();
      const weightedCriteria = [];
      for (const submittedScore of parsed.data.scores) {
        const criterion = criterionById.get(submittedScore.criterionId);
        if (!criterion) return { status: 422, error: "A avaliação contém um critério inválido." };
        if (seenCriteria.has(submittedScore.criterionId)) return { status: 422, error: "Não envie o mesmo critério mais de uma vez." };
        seenCriteria.add(submittedScore.criterionId);
        weightedCriteria.push({ criterionId: criterion.id, score: submittedScore.score, weight: criterion.weight });
      }

      let finalScore: number;
      try {
        finalScore = calculateWeightedScore(weightedCriteria);
      } catch (error) {
        return { status: 422, error: error instanceof Error ? error.message : "Não foi possível calcular a nota final." };
      }

      await tx.delete(evaluationScores).where(eq(evaluationScores.evaluationId, evaluation.id));
      await tx.insert(evaluationScores).values(weightedCriteria.map((criterion) => ({
        evaluationId: evaluation.id,
        criterionId: criterion.criterionId,
        score: criterion.score,
      })));

      const [submitted] = await tx
        .update(evaluations)
        .set({
          status: "SUBMITTED",
          feedback: parsed.data.feedback,
          finalScore: finalScore.toFixed(2),
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(evaluations.id, evaluation.id), eq(evaluations.status, "DRAFT")))
        .returning({ id: evaluations.id, status: evaluations.status, feedback: evaluations.feedback, finalScore: evaluations.finalScore, submittedAt: evaluations.submittedAt });

      if (!submitted) return { status: 409, error: "A avaliação não está disponível para envio." };

      await tx.insert(auditLogs).values({
        actorUserId: user.id,
        action: "EVALUATION_SUBMITTED",
        entityType: "EVALUATION",
        entityId: evaluation.id,
        metadata: { ideathonId: evaluation.ideathonId, phaseId: evaluation.phaseId, phaseIdeaId: evaluation.phaseIdeaId, finalScore },
      });

      return {
        data: {
          ...submitted,
          scores: weightedCriteria.map((criterion) => ({ criterionId: criterion.criterionId, score: criterion.score })),
          idempotent: false,
        },
      };
    });

    if ("error" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return NextResponse.json({ data: outcome.data });
  } catch (error) {
    console.error("Failed to submit evaluation", error);
    return NextResponse.json({ error: "Não foi possível enviar a avaliação." }, { status: 500 });
  }
}
