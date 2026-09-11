import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ideas,
  ideathons,
  phaseIdeas,
  phases,
  teamMembers,
  teams,
} from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const db = getDb();
  const selectEvent = () =>
    db
      .select({
        id: ideathons.id,
        name: ideathons.name,
        slug: ideathons.slug,
        description: ideathons.description,
        status: ideathons.status,
        timezone: ideathons.timezone,
        startsAt: ideathons.startsAt,
        endsAt: ideathons.endsAt,
      })
      .from(ideathons);
  let [event] = await selectEvent().where(eq(ideathons.slug, id)).limit(1);
  if (
    !event &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    [event] = await selectEvent().where(eq(ideathons.id, id)).limit(1);
  }
  if (!event)
    return NextResponse.json(
      { error: "Ideathon não encontrado." },
      { status: 404 },
    );
  const [phaseRows, ideaRows, memberRows] = await Promise.all([
    db
      .select({
        id: phases.id,
        name: phases.name,
        position: phases.position,
        status: phases.status,
        startsAt: phases.startsAt,
        endsAt: phases.endsAt,
      })
      .from(phases)
      .where(eq(phases.ideathonId, event.id))
      .orderBy(asc(phases.position)),
    db
      .select({
        id: ideas.id,
        name: ideas.name,
        solution: ideas.solution,
        category: ideas.category,
        pitchDeckUrl: ideas.pitchDeckUrl,
        videoPitchUrl: ideas.videoPitchUrl,
        teamId: teams.id,
        teamName: teams.name,
        phaseId: phaseIdeas.phaseId,
        phaseName: phases.name,
      })
      .from(ideas)
      .innerJoin(teams, eq(teams.id, ideas.teamId))
      .leftJoin(phaseIdeas, eq(phaseIdeas.ideaId, ideas.id))
      .leftJoin(
        phases,
        and(eq(phases.id, phaseIdeas.phaseId), eq(phases.ideathonId, event.id)),
      )
      .where(and(eq(ideas.ideathonId, event.id), eq(ideas.status, "ACTIVE")))
      .orderBy(asc(ideas.createdAt)),
    db
      .select({
        teamId: teamMembers.teamId,
        name: teamMembers.name,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.teamId))
      .where(eq(teams.ideathonId, event.id))
      .orderBy(asc(teamMembers.position)),
  ]);
  const membersByTeam = new Map<
    string,
    Array<{ name: string; role: string }>
  >();
  for (const member of memberRows)
    membersByTeam.set(member.teamId, [
      ...(membersByTeam.get(member.teamId) || []),
      { name: member.name, role: member.role },
    ]);
  return NextResponse.json({
    data: {
      ...event,
      phases: phaseRows,
      ideas: ideaRows.map(({ teamId, ...idea }) => ({
        ...idea,
        members: membersByTeam.get(teamId) || [],
      })),
    },
  });
}
