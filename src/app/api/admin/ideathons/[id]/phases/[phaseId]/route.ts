import { NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluations, ideathons, phaseIdeas, phases, rooms } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { deleteDemoPhase, getDemoIdeathon, getDemoPhase, patchDemoPhase } from "@/lib/demo-store";
import { canTransitionPhaseStatus, isPhaseStatus } from "@/lib/phase-status";
import { hasValidPhaseDateRange, parsePhaseDates } from "@/lib/phase-dates";

type RouteContext = { params: Promise<{ id: string; phaseId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Envie dados válidos para a fase." }, { status: 422 });
  const input = body as Record<string, unknown>;
  const name = input.name === undefined ? undefined : String(input.name).trim();
  const position = input.position === undefined ? undefined : Number(input.position);
  const statusValue = input.status === undefined ? undefined : String(input.status);
  const status = statusValue === undefined || !isPhaseStatus(statusValue) ? undefined : statusValue;
  const dates = parsePhaseDates(input);
  if (!dates.ok) return NextResponse.json({ error: dates.error }, { status: 422 });
  if (name !== undefined && name.length < 2) return NextResponse.json({ error: "Informe um nome válido para a fase." }, { status: 422 });
  if (position !== undefined && (!Number.isInteger(position) || position < 0)) return NextResponse.json({ error: "A posição deve ser um inteiro não negativo." }, { status: 422 });
  if (statusValue !== undefined && !isPhaseStatus(statusValue)) return NextResponse.json({ error: "Status de fase inválido." }, { status: 422 });
  if (isDemoMode) {
    const current = getDemoPhase(id, phaseId);
    if (!current) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
    if (getDemoIdeathon(id)?.status === "CLOSED" && status !== undefined && status !== "CLOSED") return NextResponse.json({ error: "O ideathon está encerrado. Não é possível iniciar ou reabrir suas fases." }, { status: 409 });
    if (status !== undefined && !canTransitionPhaseStatus(current.status, status)) return NextResponse.json({ error: "Transição de status da fase não permitida." }, { status: 409 });
    const startsAt = dates.data.startsAt === undefined ? current.startsAt : dates.data.startsAt;
    const endsAt = dates.data.endsAt === undefined ? current.endsAt : dates.data.endsAt;
    if (!hasValidPhaseDateRange(startsAt ? new Date(startsAt) : null, endsAt ? new Date(endsAt) : null)) return NextResponse.json({ error: "O término da fase deve ser posterior ao início." }, { status: 422 });
    const updated = patchDemoPhase(id, phaseId, { name, position, status, startsAt: dates.data.startsAt, endsAt: dates.data.endsAt });
    return updated ? NextResponse.json({ data: updated }) : NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  }
  const db = getDb();
  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx.select({ id: ideathons.id, status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).for("update").limit(1);
      if (!event) return { error: "Ideathon não encontrado.", status: 404 } as const;
      if (event.status === "CLOSED" && status !== undefined && status !== "CLOSED") return { error: "O ideathon está encerrado. Não é possível iniciar ou reabrir suas fases.", status: 409 } as const;
      const [current] = await tx.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status, startsAt: phases.startsAt, endsAt: phases.endsAt }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).for("update").limit(1);
      if (!current) return { error: "Fase não encontrada.", status: 404 } as const;
      if (status !== undefined && !canTransitionPhaseStatus(current.status, status)) return { error: "Transição de status da fase não permitida.", status: 409 } as const;
      const startsAt = dates.data.startsAt === undefined ? current.startsAt : dates.data.startsAt;
      const endsAt = dates.data.endsAt === undefined ? current.endsAt : dates.data.endsAt;
      if (!hasValidPhaseDateRange(startsAt, endsAt)) return { error: "O término da fase deve ser posterior ao início.", status: 422 } as const;
      const updates = { name: name ?? current.name, position: position ?? current.position, status: status ?? current.status, startsAt, endsAt, updatedAt: new Date() };
      const shouldResetRooms = status === "DRAFT" && current.status !== "DRAFT";
      const [phase] = await tx.update(phases).set(updates).where(eq(phases.id, phaseId)).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: updates.status === "LIVE" ? "PHASE_STARTED" : updates.status === "CLOSED" ? "PHASE_CLOSED" : "PHASE_UPDATED", entityType: "PHASE", entityId: phaseId, metadata: { ideathonId: id, phaseId, status: updates.status } });
      if (phase.status === "LIVE" && event.status !== "LIVE" && event.status !== "CLOSED") {
        await tx.update(ideathons).set({ status: "LIVE", updatedAt: new Date() }).where(eq(ideathons.id, id));
        await tx.insert(auditLogs).values({ actorUserId: user.id, action: "IDEATHON_STARTED", entityType: "IDEATHON", entityId: id, metadata: { ideathonId: id, phaseId, previousStatus: event.status, status: "LIVE" } });
      }
      if (shouldResetRooms) {
        const resetRooms = await tx.update(rooms).set({ status: "DRAFT", updatedAt: new Date() }).where(and(eq(rooms.phaseId, phaseId), ne(rooms.status, "DRAFT"))).returning({ id: rooms.id });
        if (resetRooms.length) await tx.insert(auditLogs).values(resetRooms.map((room) => ({ actorUserId: user.id, action: "ROOM_UPDATED", entityType: "ROOM", entityId: room.id, metadata: { ideathonId: id, phaseId, status: "DRAFT" } })));
      }
      return { data: phase } as const;
    });
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update phase", error);
    return NextResponse.json({ error: "Não foi possível atualizar a fase. Verifique se já existe outra fase ao vivo ou com a mesma posição." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId } = await params;
  if (isDemoMode) {
    const deleted = deleteDemoPhase(id, phaseId);
    return deleted ? NextResponse.json({ data: deleted }) : NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  }
  const db = getDb();
  const [current] = await db.select({ id: phases.id, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!current) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  if (current.status === "LIVE" || current.status === "CLOSED") return NextResponse.json({ error: "Fases ao vivo ou encerradas não podem ser removidas." }, { status: 409 });
  const [[ideaCount], [evaluationCount]] = await Promise.all([
    db.select({ value: count() }).from(phaseIdeas).where(eq(phaseIdeas.phaseId, phaseId)),
    db.select({ value: count() }).from(evaluations).innerJoin(phaseIdeas, eq(evaluations.phaseIdeaId, phaseIdeas.id)).where(eq(phaseIdeas.phaseId, phaseId)),
  ]);
  if (Number(ideaCount.value) || Number(evaluationCount.value)) return NextResponse.json({ error: "Esta fase já possui dados associados e não pode ser removida." }, { status: 409 });
  await db.transaction(async (tx) => {
    await tx.delete(phases).where(eq(phases.id, phaseId));
    await tx.insert(auditLogs).values({ actorUserId: user.id, action: "PHASE_DELETED", entityType: "PHASE", entityId: phaseId, metadata: { ideathonId: id, phaseId } });
  });
  return NextResponse.json({ data: { id: phaseId, deleted: true } });
}
