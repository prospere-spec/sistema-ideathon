import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideas, phaseIdeas, phases, rooms } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string; phaseId: string; ideaId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId, ideaId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  if (!body || typeof body !== "object" || !("roomId" in body)) return NextResponse.json({ error: "Informe a sala ou null para deixar a ideia sem sala." }, { status: 422 });
  const rawRoomId = (body as Record<string, unknown>).roomId;
  if (rawRoomId !== null && typeof rawRoomId !== "string") return NextResponse.json({ error: "O identificador da sala é inválido." }, { status: 422 });
  const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() || null : null;

  const db = getDb();
  const [phase] = await db.select({ id: phases.id, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!phase) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  if (phase.status === "LIVE" || phase.status === "CLOSED") return NextResponse.json({ error: "A distribuição de ideias está bloqueada nesta fase." }, { status: 409 });

  const [idea] = await db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.ideathonId, id), eq(ideas.status, "ACTIVE"))).limit(1);
  if (!idea) return NextResponse.json({ error: "Ideia não encontrada neste ideathon." }, { status: 404 });

  if (roomId) {
    const [room] = await db.select({ id: rooms.id, status: rooms.status }).from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.phaseId, phaseId))).limit(1);
    if (!room) return NextResponse.json({ error: "Sala não encontrada nesta fase." }, { status: 404 });
    if (room.status === "LIVE" || room.status === "CLOSED") return NextResponse.json({ error: "A sala não aceita novas ideias." }, { status: 409 });
  }

  try {
    const assignment = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: phaseIdeas.id, roomId: phaseIdeas.roomId }).from(phaseIdeas).where(and(eq(phaseIdeas.phaseId, phaseId), eq(phaseIdeas.ideaId, ideaId))).limit(1);
      if (current?.roomId && roomId && current.roomId !== roomId) return { conflict: true as const };
      if (current && current.roomId === roomId) return { saved: current, unchanged: true as const };

      const savedRows = current
        ? await tx.update(phaseIdeas).set({ roomId, updatedAt: new Date() }).where(eq(phaseIdeas.id, current.id)).returning()
        : await tx.insert(phaseIdeas).values({ phaseId, ideaId, roomId }).returning();
      const saved = savedRows[0];
      if (!saved) throw new Error("Phase idea was not saved.");
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: roomId ? "IDEA_ASSIGNED_TO_ROOM" : "IDEA_REMOVED_FROM_ROOM", entityType: "PHASE_IDEA", entityId: saved.id, metadata: { ideathonId: id, phaseId, ideaId, roomId } });
      return { saved, unchanged: false as const };
    });

    if ("conflict" in assignment) return NextResponse.json({ error: "A ideia já está atribuída a outra sala nesta fase." }, { status: 409 });
    return NextResponse.json({ data: assignment.saved });
  } catch (error) {
    console.error("Failed to assign idea to room", error);
    return NextResponse.json({ error: "Não foi possível atualizar a distribuição da ideia." }, { status: 500 });
  }
}
