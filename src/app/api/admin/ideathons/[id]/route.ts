import { NextResponse } from "next/server";
import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluationConfigs, evaluationCriteria, evaluations, ideas, ideathons, phases, phaseIdeas, teams } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoIdeathon } from "@/lib/demo-store";

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
  const body = await request.json() as Record<string, unknown>;
  const updates: Partial<typeof ideathons.$inferInsert> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.timezone !== undefined) updates.timezone = String(body.timezone).trim();
  if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
  if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 422 });
  const db = getDb();
  const [updated] = await db.update(ideathons).set({ ...updates, updatedAt: new Date() }).where(eq(ideathons.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  await db.insert(auditLogs).values({ actorUserId: user.id, action: "IDEATHON_UPDATED", entityType: "IDEATHON", entityId: id, metadata: { ideathonId: id, fields: Object.keys(updates) } });
  return NextResponse.json({ data: updated });
}
