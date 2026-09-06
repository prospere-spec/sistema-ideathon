import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, phases, roomEvaluators, rooms, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string; roomId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, roomId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as Record<string, unknown>).evaluatorIds)) return NextResponse.json({ error: "Envie a lista de avaliadores da banca." }, { status: 422 });

  const rawEvaluatorIds = (body as Record<string, unknown>).evaluatorIds as unknown[];
  const evaluatorIds = rawEvaluatorIds.map((value) => typeof value === "string" ? value.trim() : "");
  if (evaluatorIds.some((value) => !value)) return NextResponse.json({ error: "Há um avaliador inválido na lista." }, { status: 422 });
  if (new Set(evaluatorIds).size !== evaluatorIds.length) return NextResponse.json({ error: "Não repita avaliadores na mesma banca." }, { status: 422 });

  const db = getDb();
  const [room] = await db.select({ id: rooms.id, status: rooms.status, phaseId: phases.id, phaseStatus: phases.status }).from(rooms).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(and(eq(rooms.id, roomId), eq(phases.ideathonId, id))).limit(1);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  if (room.status === "LIVE" || room.status === "CLOSED" || room.phaseStatus === "LIVE" || room.phaseStatus === "CLOSED") return NextResponse.json({ error: "A banca não aceita alterações neste estado." }, { status: 409 });

  const evaluators = evaluatorIds.length ? await db.select({ id: users.id }).from(users).where(and(inArray(users.id, evaluatorIds), eq(users.role, "EVALUATOR"), eq(users.status, "ACTIVE"))) : [];
  if (evaluators.length !== evaluatorIds.length) return NextResponse.json({ error: "Um ou mais avaliadores não estão ativos ou não possuem o papel correto." }, { status: 422 });

  try {
    const saved = await db.transaction(async (tx) => {
      await tx.delete(roomEvaluators).where(eq(roomEvaluators.roomId, roomId));
      if (evaluatorIds.length) await tx.insert(roomEvaluators).values(evaluatorIds.map((evaluatorId) => ({ roomId, evaluatorId })));
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: "ROOM_EVALUATORS_UPDATED", entityType: "ROOM", entityId: roomId, metadata: { ideathonId: id, phaseId: room.phaseId, evaluatorIds } });
      return evaluatorIds;
    });
    return NextResponse.json({ data: { roomId, evaluatorIds: saved } });
  } catch (error) {
    console.error("Failed to update room evaluators", error);
    return NextResponse.json({ error: "Não foi possível atualizar os avaliadores da banca." }, { status: 500 });
  }
}
