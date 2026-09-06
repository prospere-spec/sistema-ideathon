import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideas, teamMembers, teams } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { parseIdeaInput } from "@/lib/idea-validation";

type RouteContext = { params: Promise<{ id: string; ideaId: string }> };

async function findIdea(ideathonId: string, ideaId: string) {
  const db = getDb();
  const [idea] = await db
    .select({
      id: ideas.id,
      ideathonId: ideas.ideathonId,
      name: ideas.name,
      problem: ideas.problem,
      solution: ideas.solution,
      audience: ideas.audience,
      differentiation: ideas.differentiation,
      category: ideas.category,
      pitchDeckUrl: ideas.pitchDeckUrl,
      videoPitchUrl: ideas.videoPitchUrl,
      websiteUrl: ideas.websiteUrl,
      status: ideas.status,
      teamId: teams.id,
      teamName: teams.name,
      createdAt: ideas.createdAt,
      updatedAt: ideas.updatedAt,
    })
    .from(ideas)
    .innerJoin(teams, eq(teams.id, ideas.teamId))
    .where(and(eq(ideas.id, ideaId), eq(ideas.ideathonId, ideathonId)))
    .limit(1);

  return idea;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id, ideaId } = await params;
  const idea = await findIdea(id, ideaId);
  if (!idea) return NextResponse.json({ error: "Ideia não encontrada." }, { status: 404 });

  const db = getDb();
  const members = await db
    .select({ id: teamMembers.id, name: teamMembers.name, role: teamMembers.role, email: teamMembers.email, position: teamMembers.position })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, idea.teamId))
    .orderBy(asc(teamMembers.position));

  return NextResponse.json({ data: { ...idea, members } });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;

  const { id, ideaId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const parsed = parseIdeaInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const current = await findIdea(id, ideaId);
  if (!current) return NextResponse.json({ error: "Ideia não encontrada." }, { status: 404 });

  const db = getDb();
  try {
    const updated = await db.transaction(async (tx) => {
      const [team] = await tx
        .update(teams)
        .set({ name: parsed.data.teamName, updatedAt: new Date() })
        .where(eq(teams.id, current.teamId))
        .returning({ id: teams.id });

      await tx.delete(teamMembers).where(eq(teamMembers.teamId, team.id));
      if (parsed.data.members.length) {
        await tx.insert(teamMembers).values(parsed.data.members.map((member, position) => ({
          teamId: team.id,
          name: member.name,
          role: member.role,
          email: member.email,
          position,
        })));
      }

      const [idea] = await tx
        .update(ideas)
        .set({
          name: parsed.data.name,
          problem: parsed.data.problem,
          solution: parsed.data.solution,
          audience: parsed.data.audience,
          differentiation: parsed.data.differentiation,
          category: parsed.data.category,
          pitchDeckUrl: parsed.data.pitchDeckUrl,
          videoPitchUrl: parsed.data.videoPitchUrl,
          websiteUrl: parsed.data.websiteUrl,
          updatedAt: new Date(),
        })
        .where(and(eq(ideas.id, ideaId), eq(ideas.ideathonId, id)))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: user.id,
        action: "IDEA_UPDATED",
        entityType: "IDEA",
        entityId: ideaId,
        metadata: { ideathonId: id, teamId: team.id },
      });

      return idea;
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update idea", error);
    return NextResponse.json({ error: "Não foi possível atualizar a ideia." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;

  const { id, ideaId } = await params;
  const db = getDb();
  const [archived] = await db
    .update(ideas)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(and(eq(ideas.id, ideaId), eq(ideas.ideathonId, id)))
    .returning({ id: ideas.id, status: ideas.status });

  if (!archived) return NextResponse.json({ error: "Ideia não encontrada." }, { status: 404 });

  await db.insert(auditLogs).values({
    actorUserId: user.id,
    action: "IDEA_ARCHIVED",
    entityType: "IDEA",
    entityId: ideaId,
    metadata: { ideathonId: id },
  });

  return NextResponse.json({ data: archived });
}
