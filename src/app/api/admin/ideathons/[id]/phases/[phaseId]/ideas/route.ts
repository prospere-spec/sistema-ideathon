import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ideas, ideathons, phaseIdeas, phases, rooms, teams } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string; phaseId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId } = await params;
  const db = getDb();
  const [phase] = await db.select({ id: phases.id, name: phases.name, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!phase) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });

  const [ideaRows, roomRows] = await Promise.all([
    db.select({ id: ideas.id, name: ideas.name, category: ideas.category, teamName: teams.name, phaseIdeaId: phaseIdeas.id, roomId: phaseIdeas.roomId, roomName: rooms.name, participationStatus: phaseIdeas.status }).from(ideas).innerJoin(teams, eq(teams.id, ideas.teamId)).leftJoin(phaseIdeas, and(eq(phaseIdeas.ideaId, ideas.id), eq(phaseIdeas.phaseId, phaseId))).leftJoin(rooms, eq(rooms.id, phaseIdeas.roomId)).where(and(eq(ideas.ideathonId, id), eq(ideas.status, "ACTIVE"))).orderBy(asc(ideas.createdAt)),
    db.select({ id: rooms.id, name: rooms.name, status: rooms.status, position: rooms.position }).from(rooms).where(eq(rooms.phaseId, phaseId)).orderBy(asc(rooms.position)),
  ]);

  return NextResponse.json({ phase, rooms: roomRows, data: ideaRows });
}
