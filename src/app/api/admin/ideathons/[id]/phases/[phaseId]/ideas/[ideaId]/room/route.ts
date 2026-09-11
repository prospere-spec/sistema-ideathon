import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
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
  if (!body || typeof body !== "object" || !("roomId" in body)) return NextResponse.json({ error: "Selecione uma sala ou deixe a ideia sem sala." }, { status: 422 });
  const input = body as Record<string, unknown>;
  const rawRoomId = input.roomId;
  if (rawRoomId !== null && typeof rawRoomId !== "string") return NextResponse.json({ error: "O identificador da sala é inválido." }, { status: 422 });
  const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() || null : null;
  const hasPresentationOrder = Object.prototype.hasOwnProperty.call(input, "presentationOrder");
  const presentationOrder = hasPresentationOrder && input.presentationOrder !== null ? Number(input.presentationOrder) : hasPresentationOrder ? null : undefined;
  if (presentationOrder !== undefined && presentationOrder !== null && (!Number.isInteger(presentationOrder) || presentationOrder < 1)) return NextResponse.json({ error: "A ordem de apresentação deve ser um inteiro positivo." }, { status: 422 });

  const db = getDb();
  const [phase] = await db.select({ id: phases.id, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!phase) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  if (phase.status === "CLOSED") return NextResponse.json({ error: "A distribuição de ideias está bloqueada nesta fase." }, { status: 409 });

  const [idea] = await db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.ideathonId, id), eq(ideas.status, "ACTIVE"))).limit(1);
  if (!idea) return NextResponse.json({ error: "Ideia não encontrada neste ideathon." }, { status: 404 });

  if (roomId) {
    const [room] = await db.select({ id: rooms.id, status: rooms.status }).from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.phaseId, phaseId))).limit(1);
    if (!room) return NextResponse.json({ error: "Sala não encontrada nesta fase." }, { status: 404 });
    if ((room.status === "LIVE" || room.status === "CLOSED") && !(phase.status === "LIVE" && hasPresentationOrder)) return NextResponse.json({ error: "A sala não aceita novas ideias." }, { status: 409 });
  }

  try {
    const assignment = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: phaseIdeas.id, roomId: phaseIdeas.roomId, presentationOrder: phaseIdeas.presentationOrder }).from(phaseIdeas).where(and(eq(phaseIdeas.phaseId, phaseId), eq(phaseIdeas.ideaId, ideaId))).limit(1);
      if (phase.status === "LIVE" && (!current || current.roomId !== roomId)) return { locked: true as const };
      if (current?.roomId && roomId && current.roomId !== roomId) return { conflict: true as const };
      if (current && current.roomId === roomId && presentationOrder === undefined) return { saved: current, unchanged: true as const };

      const savedRows = current
        ? await tx.update(phaseIdeas).set({ roomId, presentationOrder: roomId ? presentationOrder ?? current.presentationOrder : null, updatedAt: new Date() }).where(eq(phaseIdeas.id, current.id)).returning()
        : await tx.insert(phaseIdeas).values({ phaseId, ideaId, roomId, presentationOrder: roomId ? presentationOrder : null }).returning();
      const saved = savedRows[0];
      if (!saved) throw new Error("Phase idea was not saved.");

      let normalizedSaved = saved;
      let orderedIds: string[] | undefined;
      if (roomId) {
        const rows = await tx.select({ id: phaseIdeas.id, presentationOrder: phaseIdeas.presentationOrder, createdAt: phaseIdeas.createdAt }).from(phaseIdeas).where(eq(phaseIdeas.roomId, roomId)).orderBy(asc(phaseIdeas.presentationOrder), asc(phaseIdeas.createdAt));
        const remaining = rows.filter((row) => row.id !== saved.id);
        const target = presentationOrder ?? rows.length;
        const insertionIndex = Math.max(0, Math.min(target - 1, remaining.length));
        remaining.splice(insertionIndex, 0, saved);
        for (const [index, row] of remaining.entries()) await tx.update(phaseIdeas).set({ presentationOrder: index + 1, updatedAt: new Date() }).where(eq(phaseIdeas.id, row.id));
        const finalOrder = remaining.findIndex((row) => row.id === saved.id) + 1;
        normalizedSaved = { ...saved, presentationOrder: finalOrder };
        orderedIds = remaining.map((row) => row.id);
      }
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: roomId ? "IDEA_ASSIGNED_TO_ROOM" : "IDEA_REMOVED_FROM_ROOM", entityType: "PHASE_IDEA", entityId: saved.id, metadata: { ideathonId: id, phaseId, ideaId, roomId } });
      return { saved: normalizedSaved, orderedIds, unchanged: false as const };
    });

    if ("locked" in assignment) return NextResponse.json({ error: "A fase ao vivo permite apenas ajustar a ordem de apresentação." }, { status: 409 });
    if ("conflict" in assignment) return NextResponse.json({ error: "A ideia já está atribuída a outra sala nesta fase." }, { status: 409 });
    return NextResponse.json({ data: { ...assignment.saved, orderedIds: "orderedIds" in assignment ? assignment.orderedIds : undefined } });
  } catch (error) {
    console.error("Failed to assign idea to room", error);
    return NextResponse.json({ error: "Não foi possível atualizar a distribuição da ideia." }, { status: 500 });
  }
}
