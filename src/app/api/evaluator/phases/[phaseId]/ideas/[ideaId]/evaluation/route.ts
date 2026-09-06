import { NextResponse } from "next/server";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluationConfigs, evaluationCriteria, evaluationScores, evaluations, ideas, phaseIdeas, phases, roomEvaluators, rooms, teams } from "@/db/schema";
import { requireEvaluatorApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoEvaluation, saveDemoEvaluation } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ phaseId: string; ideaId: string }> };

async function loadAccess(phaseId: string, ideaId: string, evaluatorId: string) {
  const db = getDb();
  const [access] = await db
    .select({
       phaseId: phases.id,
       ideathonId: phases.ideathonId,
      phaseStatus: phases.status,
      phaseIdeaId: phaseIdeas.id,
      roomId: rooms.id,
      roomStatus: rooms.status,
      ideaId: ideas.id,
      ideaName: ideas.name,
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
    })
    .from(phaseIdeas)
    .innerJoin(phases, eq(phases.id, phaseIdeas.phaseId))
    .innerJoin(rooms, and(eq(rooms.id, phaseIdeas.roomId), eq(rooms.phaseId, phaseId)))
    .innerJoin(roomEvaluators, and(eq(roomEvaluators.roomId, rooms.id), eq(roomEvaluators.evaluatorId, evaluatorId)))
    .innerJoin(ideas, and(eq(ideas.id, phaseIdeas.ideaId), eq(ideas.status, "ACTIVE")))
    .innerJoin(teams, eq(teams.id, ideas.teamId))
    .where(and(eq(phaseIdeas.phaseId, phaseId), eq(phaseIdeas.ideaId, ideaId), eq(phases.status, "LIVE"), eq(rooms.status, "LIVE")))
    .limit(1);
  return access;
}

type EvaluationQueryDb = Pick<ReturnType<typeof getDb>, "select">;

async function getEvaluationData(db: EvaluationQueryDb, evaluationId: string, configId: string) {
  const [evaluation] = await db.select({ id: evaluations.id, status: evaluations.status, feedback: evaluations.feedback, finalScore: evaluations.finalScore, submittedAt: evaluations.submittedAt, updatedAt: evaluations.updatedAt }).from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  const criteria = await db.select({ id: evaluationCriteria.id, name: evaluationCriteria.name, description: evaluationCriteria.description, position: evaluationCriteria.position, weight: evaluationCriteria.weight }).from(evaluationCriteria).where(eq(evaluationCriteria.evaluationConfigId, configId)).orderBy(asc(evaluationCriteria.position));
  const scores = await db.select({ criterionId: evaluationScores.criterionId, score: evaluationScores.score }).from(evaluationScores).where(eq(evaluationScores.evaluationId, evaluationId));
  return { evaluation, criteria, scores };
}

function parseDraftPayload(input: unknown): { scores?: Array<{ criterionId: string; score: number }>; feedback?: string | null } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Envie dados válidos para o rascunho." };
  const body = input as Record<string, unknown>;
  const result: { scores?: Array<{ criterionId: string; score: number }>; feedback?: string | null } = {};

  if (body.scores !== undefined) {
    if (!Array.isArray(body.scores)) return { error: "A lista de notas é inválida." };
    const scores: Array<{ criterionId: string; score: number }> = [];
    for (const rawScore of body.scores) {
      if (!rawScore || typeof rawScore !== "object") return { error: "Há uma nota inválida no rascunho." };
      const score = rawScore as Record<string, unknown>;
      const criterionId = String(score.criterionId ?? "").trim();
      if (!criterionId || typeof score.score !== "number" || !Number.isInteger(score.score) || score.score < 1 || score.score > 5) return { error: "As notas devem ser inteiros entre 1 e 5." };
      scores.push({ criterionId, score: score.score });
    }
    result.scores = scores;
  }

  if (Object.prototype.hasOwnProperty.call(body, "feedback")) {
    if (body.feedback !== null && typeof body.feedback !== "string") return { error: "O feedback informado é inválido." };
    const feedback = typeof body.feedback === "string" ? body.feedback.trim() : null;
    if (feedback && feedback.length > 5000) return { error: "O feedback deve ter no máximo 5000 caracteres." };
    result.feedback = feedback || null;
  }

  if (result.scores === undefined && result.feedback === undefined) return { error: "Nenhuma alteração foi informada." };
  return result;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireEvaluatorApi();
  if (response) return response;
  const { phaseId, ideaId } = await params;
  if (isDemoMode) {
    const data = getDemoEvaluation(phaseId, ideaId, user.id);
    return "error" in data ? NextResponse.json({ error: data.error }, { status: data.status }) : NextResponse.json(data);
  }
  const access = await loadAccess(phaseId, ideaId, user.id);
  if (!access) return NextResponse.json({ error: "Ideia não encontrada ou não está atribuída a você." }, { status: 404 });

  const db = getDb();
  try {
    const data = await db.transaction(async (tx) => {
      let [evaluation] = await tx.select({ id: evaluations.id, evaluationConfigId: evaluations.evaluationConfigId }).from(evaluations).where(and(eq(evaluations.phaseIdeaId, access.phaseIdeaId), eq(evaluations.evaluatorId, user.id))).limit(1);
      if (!evaluation) {
        const [config] = await tx.select({ id: evaluationConfigs.id }).from(evaluationConfigs).where(and(eq(evaluationConfigs.phaseId, phaseId), or(eq(evaluationConfigs.status, "PUBLISHED"), eq(evaluationConfigs.status, "LOCKED")))).orderBy(desc(evaluationConfigs.version)).limit(1);
        if (!config) return { error: "A configuração de avaliação ainda não está disponível.", status: 409 };
        const [created] = await tx.insert(evaluations).values({ phaseIdeaId: access.phaseIdeaId, evaluatorId: user.id, roomId: access.roomId, evaluationConfigId: config.id }).onConflictDoNothing().returning({ id: evaluations.id });
        [evaluation] = await tx.select({ id: evaluations.id, evaluationConfigId: evaluations.evaluationConfigId }).from(evaluations).where(and(eq(evaluations.phaseIdeaId, access.phaseIdeaId), eq(evaluations.evaluatorId, user.id))).limit(1);
        if (!evaluation) return { error: "Não foi possível criar o rascunho.", status: 500 };
        if (created) await tx.insert(auditLogs).values({ actorUserId: user.id, action: "EVALUATION_DRAFT_CREATED", entityType: "EVALUATION", entityId: evaluation.id, metadata: { ideathonId: access.ideathonId, phaseId, phaseIdeaId: access.phaseIdeaId, ideaId, roomId: access.roomId } });
      }
      const persisted = await getEvaluationData(tx, evaluation.id, evaluation.evaluationConfigId);
      return { data: { evaluationId: evaluation.id, status: persisted.evaluation?.status, feedback: persisted.evaluation?.feedback, finalScore: persisted.evaluation?.finalScore, submittedAt: persisted.evaluation?.submittedAt, updatedAt: persisted.evaluation?.updatedAt, idea: { id: access.ideaId, name: access.ideaName, problem: access.problem, solution: access.solution, audience: access.audience, differentiation: access.differentiation, category: access.category, pitchDeckUrl: access.pitchDeckUrl, videoPitchUrl: access.videoPitchUrl, websiteUrl: access.websiteUrl, teamId: access.teamId, teamName: access.teamName }, criteria: persisted.criteria, scores: persisted.scores } };
    });
    if ("error" in data) return NextResponse.json({ error: data.error }, { status: data.status });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load evaluator draft", error);
    return NextResponse.json({ error: "Não foi possível carregar a avaliação." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireEvaluatorApi();
  if (response) return response;
  const { phaseId, ideaId } = await params;
  const access = await loadAccess(phaseId, ideaId, user.id);
  if (!access) return NextResponse.json({ error: "Ideia não encontrada ou não está atribuída a você." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  const parsed = parseDraftPayload(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (isDemoMode) {
    const data = saveDemoEvaluation(phaseId, ideaId, user.id, parsed);
    return "error" in data ? NextResponse.json({ error: data.error }, { status: data.status }) : NextResponse.json(data);
  }

  const db = getDb();
  try {
    const data = await db.transaction(async (tx) => {
      const [evaluation] = await tx.select({ id: evaluations.id, evaluationConfigId: evaluations.evaluationConfigId, status: evaluations.status, feedback: evaluations.feedback }).from(evaluations).where(and(eq(evaluations.phaseIdeaId, access.phaseIdeaId), eq(evaluations.evaluatorId, user.id))).for("update").limit(1);
      if (!evaluation) return { error: "Rascunho não encontrado.", status: 404 };
      if (evaluation.status === "SUBMITTED") return { error: "Esta avaliação já foi enviada e está somente leitura.", status: 409 };

      const criteria = await tx.select({ id: evaluationCriteria.id, name: evaluationCriteria.name, description: evaluationCriteria.description, position: evaluationCriteria.position, weight: evaluationCriteria.weight }).from(evaluationCriteria).where(eq(evaluationCriteria.evaluationConfigId, evaluation.evaluationConfigId)).orderBy(asc(evaluationCriteria.position));
      const criterionById = new Map(criteria.map((criterion) => [criterion.id, criterion]));
      const currentScores = await tx.select({ criterionId: evaluationScores.criterionId, score: evaluationScores.score }).from(evaluationScores).where(eq(evaluationScores.evaluationId, evaluation.id));
      let changed = parsed.feedback !== undefined && parsed.feedback !== evaluation.feedback;
      if (parsed.scores) {
        const seen = new Set<string>();
        for (const score of parsed.scores) {
          if (!criterionById.has(score.criterionId)) return { error: "A nota contém um critério inválido.", status: 422 };
          if (seen.has(score.criterionId)) return { error: "Não envie o mesmo critério mais de uma vez.", status: 422 };
          seen.add(score.criterionId);
          if (currentScores.find((current) => current.criterionId === score.criterionId)?.score !== score.score) changed = true;
        }
      }

      if (parsed.scores) {
        for (const score of parsed.scores) {
          await tx.insert(evaluationScores).values({ evaluationId: evaluation.id, criterionId: score.criterionId, score: score.score }).onConflictDoUpdate({ target: [evaluationScores.evaluationId, evaluationScores.criterionId], set: { score: score.score, updatedAt: new Date() } });
        }
      }
      if (changed) {
        await tx.update(evaluations).set({ feedback: parsed.feedback === undefined ? evaluation.feedback : parsed.feedback, updatedAt: new Date() }).where(eq(evaluations.id, evaluation.id));
        await tx.insert(auditLogs).values({ actorUserId: user.id, action: "EVALUATION_DRAFT_SAVED", entityType: "EVALUATION", entityId: evaluation.id, metadata: { ideathonId: access.ideathonId, phaseId, phaseIdeaId: access.phaseIdeaId, ideaId, changedScoreCount: parsed.scores?.length || 0, feedbackChanged: parsed.feedback !== undefined && parsed.feedback !== evaluation.feedback } });
      }

      const persisted = await getEvaluationData(tx, evaluation.id, evaluation.evaluationConfigId);
      return { data: { evaluationId: evaluation.id, status: persisted.evaluation?.status, feedback: persisted.evaluation?.feedback, finalScore: persisted.evaluation?.finalScore, submittedAt: persisted.evaluation?.submittedAt, updatedAt: persisted.evaluation?.updatedAt, criteria: persisted.criteria, scores: persisted.scores, saved: changed } };
    });
    if ("error" in data) return NextResponse.json({ error: data.error }, { status: data.status });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to save evaluator draft", error);
    return NextResponse.json({ error: "Não foi possível salvar o rascunho." }, { status: 500 });
  }
}
