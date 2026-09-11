import { calculateWeightedScore } from "./evaluation-score";
import type { RankingEvaluation } from "./ranking";
import { buildRankingResults } from "./ranking-results";
import { canTransitionPhaseStatus, type PhaseStatus } from "./phase-status";
import { ideathonStatusAction, ideathonStatusError } from "./ideathon-status";

type DemoStatus = PhaseStatus;
type EvaluationStatus = "DRAFT" | "SUBMITTED";
type DemoPhase = { id: string; name: string; position: number; status: DemoStatus; startsAt: string | null; endsAt: string | null };
type DemoCriterion = { id: string; name: string; description: string; position: number; weight: number };
type DemoIdea = { id: string; name: string; problem: string; solution: string; audience: string; differentiation: string; category: string; pitchDeckUrl: string | null; videoPitchUrl: string | null; websiteUrl: string | null; status: "ACTIVE" | "ARCHIVED"; teamId: string; teamName: string };
type DemoRoom = { id: string; name: string; position: number; status: DemoStatus; phaseId: string; ideaIds: string[]; evaluatorIds: string[] };
type DemoIdeathon = { id: string; name: string; slug: string; description: string; status: DemoStatus; timezone: string; startsAt: string | null; endsAt: string | null; phases: DemoPhase[]; ideas: DemoIdea[]; rooms: DemoRoom[] };
type DemoEvaluation = { id: string; ideathonId: string; phaseId: string; ideaId: string; roomId: string; evaluatorId: string; status: EvaluationStatus; feedback: string | null; finalScore: string | null; submittedAt: string | null; updatedAt: string; scores: Record<string, number> };
type DemoAuditLog = { id: string; action: string; entityType: string; entityId: string; metadata: Record<string, unknown>; createdAt: string; actor: string; actorEmail: string };
type DemoState = { ideathons: DemoIdeathon[]; criteria: Record<string, DemoCriterion[]>; evaluations: DemoEvaluation[]; auditLogs: DemoAuditLog[]; nextIdeathon: number; nextPhase: number; nextRoom: number; nextEvaluation: number; nextAudit: number };

const demoAdmin = { name: "Administrador Demo", email: "admin@demo.local" };
const demoEvaluator = { name: "Avaliador Demo", email: "avaliador@demo.local" };

const now = () => new Date().toISOString();

const initialState = (): DemoState => ({
  nextIdeathon: 1,
  nextPhase: 1,
  nextRoom: 2,
  nextEvaluation: 1,
  nextAudit: 1,
  criteria: {
    "demo-phase": [
      { id: "demo-criterion-impact", name: "Impacto", description: "Potencial de impacto da solução.", position: 1, weight: 40 },
      { id: "demo-criterion-innovation", name: "Inovação", description: "Originalidade da proposta.", position: 2, weight: 35 },
      { id: "demo-criterion-feasibility", name: "Viabilidade", description: "Capacidade de execução.", position: 3, weight: 25 },
    ],
  },
  evaluations: [],
  auditLogs: [],
  ideathons: [{
    id: "demo-ideathon",
    name: "GreenTech Challenge 2024",
    slug: "greentech-challenge-2024",
    description: "Soluções para um futuro mais sustentável.",
    status: "LIVE",
    timezone: "America/Sao_Paulo",
    startsAt: "2024-09-01T12:00:00.000Z",
    endsAt: "2024-09-30T21:00:00.000Z",
    phases: [{ id: "demo-phase", name: "Avaliação final", position: 1, status: "LIVE", startsAt: null, endsAt: null }],
    ideas: [{ id: "demo-idea", name: "Rede de Energia Comunitária", problem: "Desperdício de energia em comunidades.", solution: "Uma plataforma para compartilhar geração solar local.", audience: "Comunidades urbanas", differentiation: "Dados de consumo em tempo real.", category: "Sustentabilidade", pitchDeckUrl: null, videoPitchUrl: null, websiteUrl: null, status: "ACTIVE", teamId: "demo-team", teamName: "Equipe Horizonte" }],
    rooms: [{ id: "demo-room", name: "Banca Norte", position: 1, status: "LIVE", phaseId: "demo-phase", ideaIds: ["demo-idea"], evaluatorIds: ["demo-evaluator"] }],
  }],
});

const globalForDemo = globalThis as typeof globalThis & { ideathonDemoState?: DemoState };

function state() {
  globalForDemo.ideathonDemoState ??= initialState();
  return globalForDemo.ideathonDemoState;
}

function eventById(id: string) {
  return state().ideathons.find((event) => event.id === id) || null;
}

function audit(ideathonId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>, actor = demoAdmin) {
  const current = state();
  current.auditLogs.push({ id: `demo-audit-${current.nextAudit++}`, action, entityType, entityId, metadata: { ideathonId, ...metadata }, createdAt: now(), actor: actor.name, actorEmail: actor.email });
}

function listItem(event: DemoIdeathon) {
  return { id: event.id, name: event.name, slug: event.slug, description: event.description, status: event.status, timezone: event.timezone, startsAt: event.startsAt, endsAt: event.endsAt, ideaCount: event.ideas.filter((idea) => idea.status === "ACTIVE").length };
}

function criteriaFor(phaseId: string) {
  return state().criteria[phaseId] || [];
}

function findAssignment(phaseId: string, ideaId: string, evaluatorId: string) {
  for (const event of state().ideathons) {
    const phase = event.phases.find((item) => item.id === phaseId);
    const idea = event.ideas.find((item) => item.id === ideaId && item.status === "ACTIVE");
    const room = event.rooms.find((item) => item.phaseId === phaseId && item.ideaIds.includes(ideaId) && item.evaluatorIds.includes(evaluatorId));
    if (phase && idea && room && phase.status === "LIVE" && room.status === "LIVE") return { event, phase, idea, room };
  }
  return null;
}

function evaluationPayload(evaluation: DemoEvaluation, assignment: NonNullable<ReturnType<typeof findAssignment>>) {
  return {
    evaluationId: evaluation.id,
    status: evaluation.status,
    feedback: evaluation.feedback,
    finalScore: evaluation.finalScore,
    submittedAt: evaluation.submittedAt,
    updatedAt: evaluation.updatedAt,
    idea: assignment.idea,
    criteria: criteriaFor(evaluation.phaseId),
    scores: Object.entries(evaluation.scores).map(([criterionId, score]) => ({ criterionId, score })),
  };
}

export function resetDemoState() {
  globalForDemo.ideathonDemoState = initialState();
}

export function demoDashboard() {
  const current = state();
  const totalIdeas = current.ideathons.reduce((total, event) => total + event.ideas.filter((idea) => idea.status === "ACTIVE").length, 0);
  const evaluations = current.evaluations;
  return {
    data: current.ideathons.map((event) => ({ id: event.id, name: event.name, status: event.status, ideaCount: event.ideas.filter((idea) => idea.status === "ACTIVE").length, progress: event.status === "LIVE" ? 65 : event.status === "CLOSED" ? 100 : 0, totalEvaluations: evaluations.filter((evaluation) => evaluation.ideathonId === event.id).length, submittedEvaluations: evaluations.filter((evaluation) => evaluation.ideathonId === event.id && evaluation.status === "SUBMITTED").length })),
    reviewers: [{ id: "demo-evaluator", name: demoEvaluator.name, count: evaluations.filter((evaluation) => evaluation.evaluatorId === "demo-evaluator" && evaluation.status === "SUBMITTED").length }],
    metrics: { activeIdeathons: current.ideathons.filter((event) => event.status === "LIVE").length, totalIdeas, activeEvaluators: 1, pendingEvaluations: evaluations.filter((evaluation) => evaluation.status === "DRAFT").length },
    submissionBars: ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((day, index) => ({ day, value: index === 5 ? 8 : index + 2, highlight: index === 5 })),
  };
}

export function listDemoIdeathons() {
  return state().ideathons.map(listItem);
}

export function createDemoIdeathon(input: { name: string; slug: string; description?: string }) {
  const current = state();
  const sequence = current.nextIdeathon++;
  const phaseId = `demo-phase-${current.nextPhase++}`;
  const event: DemoIdeathon = { id: `demo-ideathon-${sequence}`, name: input.name, slug: input.slug, description: input.description || "", status: "DRAFT", timezone: "America/Sao_Paulo", startsAt: null, endsAt: null, phases: [{ id: phaseId, name: "Fase inicial", position: 1, status: "DRAFT", startsAt: null, endsAt: null }], ideas: [], rooms: [] };
  current.criteria[phaseId] = [{ id: `demo-criterion-${sequence}-impact`, name: "Impacto", description: "Potencial de impacto da solução.", position: 1, weight: 40 }, { id: `demo-criterion-${sequence}-innovation`, name: "Inovação", description: "Originalidade da proposta.", position: 2, weight: 35 }, { id: `demo-criterion-${sequence}-feasibility`, name: "Viabilidade", description: "Capacidade de execução.", position: 3, weight: 25 }];
  current.ideathons.unshift(event);
  audit(event.id, "IDEATHON_CREATED", "IDEATHON", event.id, {});
  return listItem(event);
}

export function getDemoIdeathon(id: string) {
  const event = eventById(id);
  if (!event) return null;
  const evaluationRows = state().evaluations.filter((evaluation) => evaluation.ideathonId === id);
  const evaluationConfigs = event.phases.map((phase) => ({ id: `demo-config-${phase.id}`, phaseId: phase.id, status: phase.status === "DRAFT" ? "DRAFT" : "PUBLISHED", version: 1, criterionCount: criteriaFor(phase.id).length }));
  const ideaRows = event.ideas.map(({ id: ideaId, name, category, status, teamName }) => ({ id: ideaId, name, category, status, teamName }));
  return { ...event, ideas: ideaRows, evaluationConfigs, evaluationProgress: { total: evaluationRows.length, submitted: evaluationRows.filter((evaluation) => evaluation.status === "SUBMITTED").length, percent: evaluationRows.length ? Math.round((evaluationRows.filter((evaluation) => evaluation.status === "SUBMITTED").length / evaluationRows.length) * 100) : 0 } };
}

export function patchDemoIdeathon(id: string, input: { status?: DemoStatus; name?: string; description?: string | null; timezone?: string; startsAt?: Date | null; endsAt?: Date | null }) {
  const event = eventById(id);
  if (!event) return { error: "Ideathon não encontrado.", status: 404 } as const;
  const previousStatus = event.status;
  if (input.status !== undefined) {
    const hasPreparedPhase = event.phases.some((phase) => phase.status === "READY" && criteriaFor(phase.id).length > 0 && event.rooms.some((room) => room.phaseId === phase.id && room.status === "READY" && room.evaluatorIds.length > 0 && event.ideas.some((idea) => idea.status === "ACTIVE" && room.ideaIds.includes(idea.id))));
    const error = ideathonStatusError(event.status, input.status, { hasPreparedPhase, hasLivePhase: event.phases.some((phase) => phase.status === "LIVE"), hasLiveRoom: event.rooms.some((room) => room.status === "LIVE") });
    if (error) return { error, status: 409 } as const;
    event.status = input.status;
  }
  if (input.name !== undefined) event.name = input.name;
  if (input.description !== undefined) event.description = input.description || "";
  if (input.timezone !== undefined) event.timezone = input.timezone;
  if (input.startsAt !== undefined) event.startsAt = input.startsAt?.toISOString() || null;
  if (input.endsAt !== undefined) event.endsAt = input.endsAt?.toISOString() || null;
  audit(id, event.status !== previousStatus ? ideathonStatusAction(event.status) : "IDEATHON_UPDATED", "IDEATHON", id, { previousStatus, status: event.status, fields: Object.keys(input) });
  return { data: listItem(event) } as const;
}

export function getDemoIdeas(id: string) {
  const event = eventById(id);
  return event ? { ideathon: listItem(event), data: event.ideas } : null;
}

export function getDemoRooms(id: string) {
  const event = eventById(id);
  if (!event) return null;
  return { ideathon: listItem(event), phases: event.phases, data: event.rooms.map((room) => ({ id: room.id, name: room.name, position: room.position, status: room.status, phaseId: room.phaseId, phaseName: event.phases.find((phase) => phase.id === room.phaseId)?.name || "", phaseStatus: event.phases.find((phase) => phase.id === room.phaseId)?.status || "DRAFT", ideaCount: room.ideaIds.length, evaluatorCount: room.evaluatorIds.length })) };
}

export function createDemoRoom(id: string, input: { name: string; phaseId: string; position?: number }) {
  const event = eventById(id);
  if (!event || !event.phases.some((phase) => phase.id === input.phaseId)) return null;
  const room: DemoRoom = { id: `demo-room-${state().nextRoom++}`, name: input.name, position: input.position ?? event.rooms.filter((item) => item.phaseId === input.phaseId).length + 1, status: "DRAFT", phaseId: input.phaseId, ideaIds: [], evaluatorIds: [] };
  event.rooms.push(room);
  audit(id, "ROOM_CREATED", "ROOM", room.id, { phaseId: room.phaseId });
  return { id: room.id, name: room.name, position: room.position, status: room.status, phaseId: room.phaseId };
}

export function patchDemoRoom(id: string, roomId: string, input: { name?: string; position?: number; status?: DemoStatus }) {
  const event = eventById(id);
  const room = event?.rooms.find((item) => item.id === roomId);
  if (!event || !room) return null;
  if (event.status === "CLOSED" && input.status !== undefined && input.status !== "CLOSED") return null;
  if (input.name !== undefined) room.name = input.name;
  if (input.position !== undefined) room.position = input.position;
  if (input.status !== undefined) room.status = input.status;
  const action = input.status === "LIVE" ? "ROOM_STARTED" : input.status === "CLOSED" ? "ROOM_CLOSED" : "ROOM_UPDATED";
  audit(id, action, "ROOM", room.id, { phaseId: room.phaseId, status: room.status });
  return { id: room.id, name: room.name, position: room.position, status: room.status, phaseId: room.phaseId };
}

export function deleteDemoRoom(id: string, roomId: string) {
  const event = eventById(id);
  if (!event) return null;
  const index = event.rooms.findIndex((item) => item.id === roomId);
  if (index < 0) return null;
  event.rooms.splice(index, 1);
  audit(id, "ROOM_DELETED", "ROOM", roomId, {});
  return { id: roomId, deleted: true };
}

export function getDemoPhases(id: string) {
  const event = eventById(id);
  return event ? { ideathon: listItem(event), data: event.phases } : null;
}

export function getDemoPhase(id: string, phaseId: string) {
  return eventById(id)?.phases.find((phase) => phase.id === phaseId) || null;
}

export function createDemoPhase(id: string, input: { name: string; position?: number; startsAt?: Date | null; endsAt?: Date | null }) {
  const event = eventById(id);
  if (!event) return null;
  const current = state();
  const sequence = current.nextPhase++;
  const phaseId = `demo-phase-${sequence}`;
  const phase: DemoPhase = { id: phaseId, name: input.name, position: input.position ?? event.phases.length, status: "DRAFT", startsAt: input.startsAt?.toISOString() || null, endsAt: input.endsAt?.toISOString() || null };
  event.phases.push(phase);
  current.criteria[phaseId] = [{ id: `demo-criterion-${sequence}-impact`, name: "Impacto", description: "Potencial de impacto da solução.", position: 1, weight: 40 }, { id: `demo-criterion-${sequence}-innovation`, name: "Inovação", description: "Originalidade da proposta.", position: 2, weight: 35 }, { id: `demo-criterion-${sequence}-feasibility`, name: "Viabilidade", description: "Capacidade de execução.", position: 3, weight: 25 }];
  audit(id, "PHASE_CREATED", "PHASE", phaseId, { phaseId });
  return phase;
}

export function patchDemoPhase(id: string, phaseId: string, input: { name?: string; position?: number; status?: DemoStatus; startsAt?: Date | null; endsAt?: Date | null }) {
  const event = eventById(id);
  const phase = event?.phases.find((item) => item.id === phaseId);
  if (!event || !phase) return null;
  if (event.status === "CLOSED" && input.status !== undefined && input.status !== "CLOSED") return null;
  if (input.status !== undefined && !canTransitionPhaseStatus(phase.status, input.status)) return null;
  const shouldResetRooms = input.status === "DRAFT" && phase.status !== "DRAFT";
  if (input.status === "LIVE") for (const other of event.phases) if (other.id !== phaseId && other.status === "LIVE") other.status = "READY";
  if (input.name !== undefined) phase.name = input.name;
  if (input.position !== undefined) phase.position = input.position;
  if (input.status !== undefined) phase.status = input.status;
  if (input.startsAt !== undefined) phase.startsAt = input.startsAt?.toISOString() || null;
  if (input.endsAt !== undefined) phase.endsAt = input.endsAt?.toISOString() || null;
  if (phase.status === "LIVE" && event.status !== "LIVE" && event.status !== "CLOSED") {
    const previousStatus = event.status;
    event.status = "LIVE";
    audit(id, "IDEATHON_STARTED", "IDEATHON", id, { previousStatus, status: event.status, phaseId });
  }
  audit(id, phase.status === "LIVE" ? "PHASE_STARTED" : phase.status === "CLOSED" ? "PHASE_CLOSED" : "PHASE_UPDATED", "PHASE", phaseId, { phaseId, status: phase.status });
  if (shouldResetRooms) for (const room of event.rooms) if (room.phaseId === phaseId) {
    if (room.status !== "DRAFT") {
      room.status = "DRAFT";
      audit(id, "ROOM_UPDATED", "ROOM", room.id, { phaseId, status: room.status });
    }
  }
  return phase;
}

export function deleteDemoPhase(id: string, phaseId: string) {
  const event = eventById(id);
  if (!event) return null;
  const phase = event.phases.find((item) => item.id === phaseId);
  if (!phase || phase.status === "LIVE" || phase.status === "CLOSED") return null;
  if (state().evaluations.some((evaluation) => evaluation.phaseId === phaseId)) return null;
  event.phases = event.phases.filter((item) => item.id !== phaseId);
  delete state().criteria[phaseId];
  audit(id, "PHASE_DELETED", "PHASE", phaseId, { phaseId });
  return { id: phaseId, deleted: true };
}

export function getDemoEvaluatorAssignments(evaluatorId: string) {
  return state().ideathons.flatMap((event) => event.phases.filter((phase) => phase.status === "LIVE").flatMap((phase) => event.rooms.filter((room) => room.phaseId === phase.id && room.status === "LIVE" && room.evaluatorIds.includes(evaluatorId)).flatMap((room) => room.ideaIds.flatMap((ideaId) => {
    const idea = event.ideas.find((item) => item.id === ideaId && item.status === "ACTIVE");
    const evaluationStatus = state().evaluations.find((evaluation) => evaluation.phaseId === phase.id && evaluation.ideaId === ideaId && evaluation.evaluatorId === evaluatorId)?.status || null;
    return idea ? [{ ideathonId: event.id, ideathonName: event.name, phaseId: phase.id, phaseName: phase.name, ideaId: idea.id, ideaName: idea.name, teamName: idea.teamName, roomId: room.id, roomName: room.name, presentationOrder: room.ideaIds.indexOf(idea.id) + 1, evaluationStatus }] : [];
  }))));
}

export function getDemoEvaluatorPhases(ideathonId: string, evaluatorId: string) {
  const assignments = getDemoEvaluatorAssignments(evaluatorId).filter((assignment) => assignment.ideathonId === ideathonId);
  return { data: Array.from(new Map(assignments.map((assignment) => [assignment.phaseId, { id: assignment.phaseId, name: assignment.phaseName, position: 1, status: "LIVE" as const }])).values()) };
}

export function getDemoEvaluatorIdeas(phaseId: string, evaluatorId: string) {
  const assignments = getDemoEvaluatorAssignments(evaluatorId).filter((assignment) => assignment.phaseId === phaseId);
  const event = assignments[0] ? eventById(assignments[0].ideathonId) : null;
  const phase = event?.phases.find((item) => item.id === phaseId);
  return event && phase ? { phase: { id: phase.id, ideathonId: event.id, name: phase.name, status: phase.status }, data: assignments.map((assignment) => { const idea = event.ideas.find((item) => item.id === assignment.ideaId)!; return { phaseIdeaId: `${phaseId}:${assignment.ideaId}`, ideaId: idea.id, name: idea.name, problem: idea.problem, solution: idea.solution, audience: idea.audience, differentiation: idea.differentiation, category: idea.category, pitchDeckUrl: idea.pitchDeckUrl, videoPitchUrl: idea.videoPitchUrl, websiteUrl: idea.websiteUrl, teamId: idea.teamId, teamName: idea.teamName, roomId: assignment.roomId, roomName: assignment.roomName, roomStatus: "LIVE", presentationOrder: assignment.presentationOrder, evaluationStatus: assignment.evaluationStatus, participationStatus: "ACTIVE" }; }) } : null;
}

export function getDemoEvaluation(phaseId: string, ideaId: string, evaluatorId: string) {
  const assignment = findAssignment(phaseId, ideaId, evaluatorId);
  if (!assignment) return { error: "Ideia não encontrada ou não está atribuída a você.", status: 404 as const };
  const current = state();
  let evaluation = current.evaluations.find((item) => item.phaseId === phaseId && item.ideaId === ideaId && item.evaluatorId === evaluatorId);
  if (!evaluation) {
    evaluation = { id: `demo-evaluation-${current.nextEvaluation++}`, ideathonId: assignment.event.id, phaseId, ideaId, roomId: assignment.room.id, evaluatorId, status: "DRAFT", feedback: null, finalScore: null, submittedAt: null, updatedAt: now(), scores: {} };
    current.evaluations.push(evaluation);
    audit(assignment.event.id, "EVALUATION_DRAFT_CREATED", "EVALUATION", evaluation.id, { phaseId, ideaId, roomId: assignment.room.id }, demoEvaluator);
  }
  return { data: evaluationPayload(evaluation, assignment) };
}

type DraftInput = { scores?: Array<{ criterionId: string; score: number }>; feedback?: string | null };

function validateScores(scores: Array<{ criterionId: string; score: number }>, criteria: DemoCriterion[]) {
  const known = new Set(criteria.map((criterion) => criterion.id));
  const seen = new Set<string>();
  for (const score of scores) {
    if (!known.has(score.criterionId)) return "A nota contém um critério inválido.";
    if (seen.has(score.criterionId)) return "Não envie o mesmo critério mais de uma vez.";
    if (!Number.isInteger(score.score) || score.score < 1 || score.score > 5) return "As notas devem ser inteiros entre 1 e 5.";
    seen.add(score.criterionId);
  }
  return null;
}

export function saveDemoEvaluation(phaseId: string, ideaId: string, evaluatorId: string, input: DraftInput) {
  const loaded = getDemoEvaluation(phaseId, ideaId, evaluatorId);
  if ("error" in loaded) return loaded;
  const evaluation = state().evaluations.find((item) => item.id === loaded.data.evaluationId)!;
  if (evaluation.status === "SUBMITTED") return { error: "Esta avaliação já foi enviada e está somente leitura.", status: 409 as const };
  const criteria = criteriaFor(phaseId);
  if (input.scores) {
    const scoreError = validateScores(input.scores, criteria);
    if (scoreError) return { error: scoreError, status: 422 as const };
  }
  if (input.feedback !== undefined && input.feedback !== null && input.feedback.length > 5000) return { error: "O feedback deve ter no máximo 5000 caracteres.", status: 422 as const };
  let changed = false;
  if (input.scores) for (const score of input.scores) { if (evaluation.scores[score.criterionId] !== score.score) changed = true; evaluation.scores[score.criterionId] = score.score; }
  if (input.feedback !== undefined && evaluation.feedback !== input.feedback) { evaluation.feedback = input.feedback; changed = true; }
  if (changed) { evaluation.updatedAt = now(); audit(evaluation.ideathonId, "EVALUATION_DRAFT_SAVED", "EVALUATION", evaluation.id, { phaseId, ideaId, changedScoreCount: input.scores?.length || 0, feedbackChanged: input.feedback !== undefined }, demoEvaluator); }
  const assignment = findAssignment(phaseId, ideaId, evaluatorId)!;
  return { data: { ...evaluationPayload(evaluation, assignment), saved: changed } };
}

export function submitDemoEvaluation(evaluationId: string, evaluatorId: string, input: { scores: Array<{ criterionId: string; score: number }>; feedback: string | null }) {
  const evaluation = state().evaluations.find((item) => item.id === evaluationId);
  if (!evaluation) return { error: "Avaliação não encontrada.", status: 404 as const };
  if (evaluation.evaluatorId !== evaluatorId) return { error: "Você não pode enviar esta avaliação.", status: 403 as const };
  const assignment = findAssignment(evaluation.phaseId, evaluation.ideaId, evaluatorId);
  if (!assignment) return { error: "A avaliação não está disponível para envio.", status: 409 as const };
  if (evaluation.status === "SUBMITTED") return { data: { ...evaluationPayload(evaluation, assignment), idempotent: true } };
  const criteria = criteriaFor(evaluation.phaseId);
  if (input.scores.length !== criteria.length) return { error: "Envie exatamente uma nota para cada critério.", status: 422 as const };
  const scoreError = validateScores(input.scores, criteria);
  if (scoreError) return { error: scoreError, status: 422 as const };
  const weighted = input.scores.map((score) => ({ ...score, weight: criteria.find((criterion) => criterion.id === score.criterionId)!.weight }));
  let finalScore: number;
  try { finalScore = calculateWeightedScore(weighted); } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível calcular a nota final.", status: 422 as const }; }
  evaluation.scores = Object.fromEntries(input.scores.map((score) => [score.criterionId, score.score]));
  evaluation.feedback = input.feedback;
  evaluation.finalScore = finalScore.toFixed(2);
  evaluation.status = "SUBMITTED";
  evaluation.submittedAt = now();
  evaluation.updatedAt = evaluation.submittedAt;
  audit(evaluation.ideathonId, "EVALUATION_SUBMITTED", "EVALUATION", evaluation.id, { phaseId: evaluation.phaseId, ideaId: evaluation.ideaId, finalScore }, demoEvaluator);
  return { data: { ...evaluationPayload(evaluation, assignment), idempotent: false } };
}

export function getDemoResults(id: string, queryPhaseId?: string | null) {
  const event = eventById(id);
  if (!event) return { error: "Ideathon não encontrado.", status: 404 as const };
  const phase = (queryPhaseId && event.phases.find((item) => item.id === queryPhaseId)) || event.phases.find((item) => item.status === "LIVE") || event.phases[0];
  if (!phase) return { error: "Nenhuma fase encontrada neste ideathon.", status: 404 as const };
  if (queryPhaseId && phase.id !== queryPhaseId) return { error: "Fase não encontrada neste ideathon.", status: 404 as const };
  const expectedByRoom = new Map(event.rooms.filter((room) => room.phaseId === phase.id).map((room) => [room.id, room.evaluatorIds.length]));
  const results = buildRankingResults(event.ideas.filter((idea) => idea.status === "ACTIVE").flatMap((idea) => {
    const room = event.rooms.find((item) => item.phaseId === phase.id && item.ideaIds.includes(idea.id));
    if (!room) return [];
    const evaluations: RankingEvaluation[] = state().evaluations.filter((evaluation) => evaluation.phaseId === phase.id && evaluation.ideaId === idea.id && evaluation.status === "SUBMITTED").map((evaluation) => ({ finalScore: evaluation.finalScore, submittedAt: evaluation.submittedAt, scores: criteriaFor(phase.id).filter((criterion) => evaluation.scores[criterion.id] !== undefined).map((criterion) => ({ criterionId: criterion.id, criterionName: criterion.name, score: evaluation.scores[criterion.id] })) }));
    return [{ ideaId: idea.id, ideaName: idea.name, teamName: idea.teamName, category: idea.category, roomId: room.id, roomName: room.name, expectedEvaluations: expectedByRoom.get(room.id) || 0, evaluations }];
  }), event.rooms.filter((room) => room.phaseId === phase.id).sort((left, right) => left.position - right.position));
  return { phase: { id: phase.id, name: phase.name, position: phase.position, status: phase.status }, phases: event.phases, ...results };
}

export function getDemoAuditLogs(id: string, options: { limit: number; action: string | null; entityType: string | null }) {
  return { data: state().auditLogs.filter((log) => log.metadata.ideathonId === id && (!options.action || log.action === options.action) && (!options.entityType || log.entityType === options.entityType)).sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, options.limit) };
}
