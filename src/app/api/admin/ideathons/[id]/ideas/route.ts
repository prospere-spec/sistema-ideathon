import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideas, ideathons, teamMembers, teams } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { parseIdeaInput } from "@/lib/idea-validation";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoIdeas } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  if (isDemoMode) {
    const result = getDemoIdeas(id);
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  }
  const db = getDb();
  const [ideathon] = await db.select({ id: ideathons.id, name: ideathons.name, status: ideathons.status }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!ideathon) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });

  const rows = await db
    .select({
      id: ideas.id,
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
    .where(eq(ideas.ideathonId, id))
    .orderBy(asc(ideas.createdAt));

  return NextResponse.json({ data: rows, ideathon });
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

  const parsed = parseIdeaInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const db = getDb();
  const [ideathon] = await db.select({ id: ideathons.id }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!ideathon) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });

  try {
    const created = await db.transaction(async (tx) => {
      const [team] = await tx
        .insert(teams)
        .values({ ideathonId: id, name: parsed.data.teamName })
        .onConflictDoUpdate({
          target: [teams.ideathonId, teams.name],
          set: { updatedAt: new Date() },
        })
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
        .insert(ideas)
        .values({
          ideathonId: id,
          teamId: team.id,
          name: parsed.data.name,
          problem: parsed.data.problem,
          solution: parsed.data.solution,
          audience: parsed.data.audience,
          differentiation: parsed.data.differentiation,
          category: parsed.data.category,
          pitchDeckUrl: parsed.data.pitchDeckUrl,
          videoPitchUrl: parsed.data.videoPitchUrl,
          websiteUrl: parsed.data.websiteUrl,
        })
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: user.id,
        action: "IDEA_CREATED",
        entityType: "IDEA",
        entityId: idea.id,
        metadata: { ideathonId: id, teamId: team.id },
      });

      return idea;
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create idea", error);
    return NextResponse.json({ error: "Não foi possível cadastrar a ideia." }, { status: 500 });
  }
}
