import { NextResponse } from "next/server";
import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluationConfigs, evaluationCriteria, evaluations, ideas, ideathons, phases, phaseIdeas, rooms, roomEvaluators, teams, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoIdeathon, patchDemoIdeathon } from "@/lib/demo-store";
import { ideathonStatusAction, ideathonStatusError, isIdeathonStatus } from "@/lib/ideathon-status";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  if (isDemoMode) {
    const event = getDemoIdeathon(id);
    return event ? NextResponse.json({ data: event }) : NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  }
  const db = getDb();
  const [event] = await db.select().from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!event) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  const [phaseRows, ideaRows, configRows, evaluationRows] = await Promise.all([
    db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status, startsAt: phases.startsAt, endsAt: phases.endsAt }).from(phases).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position)),
    db.select({ id: ideas.id, name: ideas.name, category: ideas.category, status: ideas.status, teamName: teams.name }).from(ideas).innerJoin(teams, eq(teams.id, ideas.teamId)).where(eq(ideas.ideathonId, id)).orderBy(asc(ideas.createdAt)),
    db.select({ id: evaluationConfigs.id, phaseId: evaluationConfigs.phaseId, status: evaluationConfigs.status, version: evaluationConfigs.version, criterionCount: count(evaluationCriteria.id) }).from(evaluationConfigs).leftJoin(evaluationCriteria, eq(evaluationCriteria.evaluationConfigId, evaluationConfigs.id)).innerJoin(phases, and(eq(phases.id, evaluationConfigs.phaseId), eq(phases.ideathonId, id))).groupBy(evaluationConfigs.id).orderBy(asc(evaluationConfigs.phaseId), evaluationConfigs.version),
    db.select({ status: evaluations.status }).from(evaluations).innerJoin(phaseIdeas, eq(phaseIdeas.id, evaluations.phaseIdeaId)).innerJoin(phases, and(eq(phases.id, phaseIdeas.phaseId), eq(phases.ideathonId, id))),
  ]);
  const totalEvaluations = evaluationRows.length;
  const submittedEvaluations = evaluationRows.filter((row) => row.status === "SUBMITTED").length;
  return NextResponse.json({ data: { ...event, phases: phaseRows, ideas: ideaRows, evaluationConfigs: configRows.map((config) => ({ ...config, criterionCount: Number(config.criterionCount) })), evaluationProgress: { total: totalEvaluations, submitted: submittedEvaluations, percent: totalEvaluations ? Math.round((submittedEvaluations / totalEvaluations) * 100) : 0 } } });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 422 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: "Envie dados válidos para o ideathon." }, { status: 422 });
  const body = input as Record<string, unknown>;
  if (body.status !== undefined && !isIdeathonStatus(body.status)) return NextResponse.json({ error: "Status de ideathon inválido." }, { status: 422 });
  const updates: Partial<typeof ideathons.$inferInsert> = {};
  if (isIdeathonStatus(body.status)) updates.status = body.status;
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.timezone !== undefined) updates.timezone = String(body.timezone).trim();
  if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
  if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 422 });
  if (isDemoMode) {
    const result = patchDemoIdeathon(id, updates);
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json(result);
  }
  const db = getDb();
  try {
    const result = await db.transaction(async (tx) => {
      // Phase transitions acquire this same parent lock, so starting a phase
      // and closing its event cannot commit contradictory statuses.
      const [current] = await tx.select({ id: ideathons.id, status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).for("update").limit(1);
      if (!current) return { error: "Ideathon não encontrado.", status: 404 } as const;
      if (updates.status && updates.status !== current.status) {
        const livePhases = await tx.select({ id: phases.id }).from(phases).where(and(eq(phases.ideathonId, id), eq(phases.status, "LIVE"))).limit(1);
        const liveRooms = await tx.select({ id: rooms.id }).from(rooms).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(and(eq(phases.ideathonId, id), eq(rooms.status, "LIVE"))).limit(1);
        const prepared = updates.status === "READY" ? await tx.select({ id: phases.id }).from(phases)
          .innerJoin(evaluationConfigs, and(eq(evaluationConfigs.phaseId, phases.id), inArray(evaluationConfigs.status, ["PUBLISHED", "LOCKED"])))
          .innerJoin(evaluationCriteria, eq(evaluationCriteria.evaluationConfigId, evaluationConfigs.id))
          .innerJoin(rooms, and(eq(rooms.phaseId, phases.id), eq(rooms.status, "READY")))
          .innerJoin(phaseIdeas, and(eq(phaseIdeas.phaseId, phases.id), eq(phaseIdeas.roomId, rooms.id), ne(phaseIdeas.status, "ELIMINATED")))
          .innerJoin(ideas, and(eq(ideas.id, phaseIdeas.ideaId), eq(ideas.status, "ACTIVE")))
          .innerJoin(roomEvaluators, eq(roomEvaluators.roomId, rooms.id))
          .innerJoin(users, and(eq(users.id, roomEvaluators.evaluatorId), eq(users.status, "ACTIVE"), eq(users.role, "EVALUATOR")))
          .where(and(eq(phases.ideathonId, id), eq(phases.status, "READY"))).limit(1) : [];
        const error = ideathonStatusError(current.status, updates.status, { hasPreparedPhase: prepared.length > 0, hasLivePhase: livePhases.length > 0, hasLiveRoom: liveRooms.length > 0 });
        if (error) return { error, status: 409 } as const;
      }
      const [updated] = await tx.update(ideathons).set({ ...updates, updatedAt: new Date() }).where(eq(ideathons.id, id)).returning();
      const statusChanged = updates.status !== undefined && updates.status !== current.status;
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: statusChanged ? ideathonStatusAction(updated.status) : "IDEATHON_UPDATED", entityType: "IDEATHON", entityId: id, metadata: { ideathonId: id, fields: Object.keys(updates), previousStatus: current.status, status: updated.status } });
      return { data: updated } as const;
    });
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update ideathon", error);
    return NextResponse.json({ error: "Não foi possível atualizar o ideathon." }, { status: 500 });
  }
}
