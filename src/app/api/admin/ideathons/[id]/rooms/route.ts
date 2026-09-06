import { NextResponse } from "next/server";
import { and, asc, eq, max } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideathons, phaseIdeas, phases, roomEvaluators, rooms } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { createDemoRoom, getDemoRooms } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

function parseRoomInput(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Envie dados válidos para a sala." } as const;
  const body = input as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const phaseId = String(body.phaseId ?? "").trim();
  const position = body.position === undefined ? undefined : Number(body.position);
  if (!name || !phaseId) return { error: "Nome e fase são obrigatórios." } as const;
  if (position !== undefined && (!Number.isInteger(position) || position < 0)) return { error: "A posição deve ser um inteiro não negativo." } as const;
  return { data: { name, phaseId, position } } as const;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  if (isDemoMode) {
    const data = getDemoRooms(id);
    return data ? NextResponse.json(data) : NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  }
  const db = getDb();

  const [ideathon, phaseRows, roomRows, ideaAssignments, evaluatorAssignments] = await Promise.all([
    db.select({ id: ideathons.id, name: ideathons.name, status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).limit(1),
    db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status }).from(phases).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position)),
    db.select({ id: rooms.id, name: rooms.name, position: rooms.position, status: rooms.status, phaseId: phases.id, phaseName: phases.name, phaseStatus: phases.status }).from(rooms).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position), asc(rooms.position)),
    db.select({ roomId: phaseIdeas.roomId }).from(phaseIdeas).innerJoin(rooms, eq(rooms.id, phaseIdeas.roomId)).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(eq(phases.ideathonId, id)),
    db.select({ roomId: roomEvaluators.roomId }).from(roomEvaluators).innerJoin(rooms, eq(rooms.id, roomEvaluators.roomId)).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(eq(phases.ideathonId, id)),
  ]);

  if (!ideathon[0]) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  const ideaCounts = new Map<string, number>();
  const evaluatorCounts = new Map<string, number>();
  for (const assignment of ideaAssignments) if (assignment.roomId) ideaCounts.set(assignment.roomId, (ideaCounts.get(assignment.roomId) || 0) + 1);
  for (const assignment of evaluatorAssignments) evaluatorCounts.set(assignment.roomId, (evaluatorCounts.get(assignment.roomId) || 0) + 1);

  return NextResponse.json({
    ideathon: ideathon[0],
    phases: phaseRows,
    data: roomRows.map((room) => ({ ...room, ideaCount: ideaCounts.get(room.id) || 0, evaluatorCount: evaluatorCounts.get(room.id) || 0 })),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  const parsed = parseRoomInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (isDemoMode) {
    const created = createDemoRoom(id, { name: parsed.data.name, phaseId: parsed.data.phaseId });
    return created ? NextResponse.json({ data: created }, { status: 201 }) : NextResponse.json({ error: "Fase não encontrada neste ideathon." }, { status: 404 });
  }

  const db = getDb();
  const [phase] = await db.select({ id: phases.id, status: phases.status }).from(phases).where(and(eq(phases.id, parsed.data.phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!phase) return NextResponse.json({ error: "Fase não encontrada neste ideathon." }, { status: 404 });
  if (phase.status === "LIVE" || phase.status === "CLOSED") return NextResponse.json({ error: "Não é possível criar salas nesta fase." }, { status: 409 });

  const [lastPosition] = await db.select({ position: max(rooms.position) }).from(rooms).where(eq(rooms.phaseId, phase.id));
  const position = parsed.data.position ?? (lastPosition.position === null ? 0 : Number(lastPosition.position) + 1);

  try {
    const created = await db.transaction(async (tx) => {
      const [room] = await tx.insert(rooms).values({ phaseId: phase.id, name: parsed.data.name, position }).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: "ROOM_CREATED", entityType: "ROOM", entityId: room.id, metadata: { ideathonId: id, phaseId: phase.id } });
      return room;
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room", error);
    return NextResponse.json({ error: "Não foi possível criar a sala. Verifique se nome e posição já existem." }, { status: 409 });
  }
}
