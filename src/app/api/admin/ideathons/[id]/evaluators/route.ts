import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ideathons, phases, roomEvaluators, rooms, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const db = getDb();
  const [ideathon] = await db.select({ id: ideathons.id, name: ideathons.name }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!ideathon) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });

  const [evaluatorRows, assignmentRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, status: users.status }).from(users).where(and(eq(users.role, "EVALUATOR"), eq(users.status, "ACTIVE"))).orderBy(asc(users.name)),
    db.select({ evaluatorId: roomEvaluators.evaluatorId, roomId: rooms.id, roomName: rooms.name, phaseId: phases.id, phaseName: phases.name }).from(roomEvaluators).innerJoin(rooms, eq(rooms.id, roomEvaluators.roomId)).innerJoin(phases, eq(phases.id, rooms.phaseId)).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position), asc(rooms.position)),
  ]);

  const roomsByEvaluator = new Map<string, Array<{ id: string; name: string; phaseId: string; phaseName: string }>>();
  for (const assignment of assignmentRows) {
    const existing = roomsByEvaluator.get(assignment.evaluatorId) || [];
    existing.push({ id: assignment.roomId, name: assignment.roomName, phaseId: assignment.phaseId, phaseName: assignment.phaseName });
    roomsByEvaluator.set(assignment.evaluatorId, existing);
  }

  return NextResponse.json({ ideathon, data: evaluatorRows.map((evaluator) => ({ ...evaluator, rooms: roomsByEvaluator.get(evaluator.id) || [] })) });
}
