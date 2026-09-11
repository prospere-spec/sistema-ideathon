import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluations, ideathons, phaseIdeas, phases, roomEvaluators, rooms } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { deleteDemoRoom, getDemoIdeathon, patchDemoRoom } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string; roomId: string }> };

async function findRoom(ideathonId: string, roomId: string) {
  const db = getDb();
  const [room] = await db.select({ id: rooms.id, name: rooms.name, position: rooms.position, status: rooms.status, phaseId: phases.id, phaseStatus: phases.status }).from(rooms).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(and(eq(rooms.id, roomId), eq(phases.ideathonId, ideathonId))).limit(1);
  return room;
}

async function assignmentCounts(roomId: string) {
  const db = getDb();
  const [[ideaCount], [evaluatorCount]] = await Promise.all([
    db.select({ value: count() }).from(phaseIdeas).where(eq(phaseIdeas.roomId, roomId)),
    db.select({ value: count() }).from(roomEvaluators).where(eq(roomEvaluators.roomId, roomId)),
  ]);
  return { ideas: Number(ideaCount.value), evaluators: Number(evaluatorCount.value) };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, roomId } = await params;
  if (isDemoMode) {
    const input = await request.json() as { name?: string; position?: number; status?: "DRAFT" | "READY" | "LIVE" | "CLOSED" };
    if (getDemoIdeathon(id)?.status === "CLOSED" && input.status !== undefined && input.status !== "CLOSED") return NextResponse.json({ error: "O ideathon está encerrado. Não é possível reabrir suas salas." }, { status: 409 });
    const updated = patchDemoRoom(id, roomId, input);
    return updated ? NextResponse.json({ data: updated }) : NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  }
  const current = await findRoom(id, roomId);
  if (!current) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  const db = getDb();
  const [event] = await db.select({ status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!event) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Envie dados válidos para a sala." }, { status: 422 });
  const input = body as Record<string, unknown>;
  const name = input.name === undefined ? current.name : String(input.name).trim();
  const position = input.position === undefined ? current.position : Number(input.position);
  const requestedStatus = input.status === undefined ? current.status : String(input.status);
  if (!name) return NextResponse.json({ error: "O nome da sala é obrigatório." }, { status: 422 });
  if (!Number.isInteger(position) || position < 0) return NextResponse.json({ error: "A posição deve ser um inteiro não negativo." }, { status: 422 });
  if (requestedStatus !== "DRAFT" && requestedStatus !== "READY" && requestedStatus !== "LIVE" && requestedStatus !== "CLOSED") return NextResponse.json({ error: "Status de sala inválido." }, { status: 422 });
  if (event.status === "CLOSED" && requestedStatus !== "CLOSED") return NextResponse.json({ error: "O ideathon está encerrado. Não é possível reabrir suas salas." }, { status: 409 });
  if (current.status === "LIVE" && (name !== current.name || position !== current.position || requestedStatus !== "CLOSED")) return NextResponse.json({ error: "Salas iniciadas não podem ser alteradas." }, { status: 409 });
  if (current.status === "CLOSED" && requestedStatus !== "CLOSED") return NextResponse.json({ error: "Salas encerradas não podem ser reabertas." }, { status: 409 });
  if (current.phaseStatus === "LIVE" && (name !== current.name || position !== current.position || requestedStatus === "DRAFT" || requestedStatus === "READY")) return NextResponse.json({ error: "A fase já está ao vivo e não aceita esta alteração." }, { status: 409 });

  const counts = await assignmentCounts(roomId);
  if (requestedStatus === "READY" && (!counts.ideas || !counts.evaluators)) return NextResponse.json({ error: "A sala precisa de ao menos uma ideia e um avaliador para ficar pronta." }, { status: 409 });
  if (requestedStatus === "LIVE" && (current.phaseStatus !== "LIVE" || !counts.ideas || !counts.evaluators)) return NextResponse.json({ error: "A sala precisa de uma fase LIVE, uma ideia e um avaliador para iniciar." }, { status: 409 });

  try {
    const result = await db.transaction(async (tx) => {
      const [lockedEvent] = await tx.select({ status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).for("update").limit(1);
      if (!lockedEvent) return { error: "Ideathon não encontrado.", status: 404 } as const;
      if (lockedEvent.status === "CLOSED" && requestedStatus !== "CLOSED") return { error: "O ideathon está encerrado. Não é possível reabrir suas salas.", status: 409 } as const;
      const result = await tx.update(rooms).set({ name, position, status: requestedStatus as "DRAFT" | "READY" | "LIVE" | "CLOSED", updatedAt: new Date() }).where(eq(rooms.id, roomId)).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: requestedStatus === "LIVE" ? "ROOM_STARTED" : requestedStatus === "CLOSED" ? "ROOM_CLOSED" : "ROOM_UPDATED", entityType: "ROOM", entityId: roomId, metadata: { ideathonId: id, phaseId: current.phaseId, status: requestedStatus } });
      return { data: result[0] } as const;
    });
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update room", error);
    return NextResponse.json({ error: "Não foi possível atualizar a sala. Verifique se nome e posição já existem." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, roomId } = await params;
  if (isDemoMode) {
    const deleted = deleteDemoRoom(id, roomId);
    return deleted ? NextResponse.json({ data: deleted }) : NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  }
  const current = await findRoom(id, roomId);
  if (!current) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  if (current.status === "LIVE" || current.status === "CLOSED") return NextResponse.json({ error: "Salas ao vivo ou encerradas não podem ser removidas." }, { status: 409 });

  const db = getDb();
  const [[ideaCount], [evaluationCount]] = await Promise.all([
    db.select({ value: count() }).from(phaseIdeas).where(eq(phaseIdeas.roomId, roomId)),
    db.select({ value: count() }).from(evaluations).where(eq(evaluations.roomId, roomId)),
  ]);
  if (Number(ideaCount.value) || Number(evaluationCount.value)) {
    const [closed] = await db.transaction(async (tx) => {
      const result = await tx.update(rooms).set({ status: "CLOSED", updatedAt: new Date() }).where(eq(rooms.id, roomId)).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: "ROOM_CLOSED", entityType: "ROOM", entityId: roomId, metadata: { ideathonId: id, reason: "ROOM_USED" } });
      return result;
    });
    return NextResponse.json({ data: closed });
  }

  await db.transaction(async (tx) => {
    await tx.delete(rooms).where(eq(rooms.id, roomId));
    await tx.insert(auditLogs).values({ actorUserId: user.id, action: "ROOM_DELETED", entityType: "ROOM", entityId: roomId, metadata: { ideathonId: id } });
  });
  return NextResponse.json({ data: { id: roomId, deleted: true } });
}
