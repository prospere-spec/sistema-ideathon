import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { evaluations, ideas, ideathons, phaseIdeas, phases, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoDashboard } from "@/lib/demo-store";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  if (isDemoMode) return NextResponse.json(demoDashboard());
  const db = getDb();
  const [eventRows, evaluationRows, evaluatorRows, pendingRows, recentSubmissions, reviewerRows] = await Promise.all([
    db.select({ id: ideathons.id, name: ideathons.name, status: ideathons.status, ideaCount: count(ideas.id) }).from(ideathons).leftJoin(ideas, and(eq(ideas.ideathonId, ideathons.id), eq(ideas.status, "ACTIVE"))).groupBy(ideathons.id).orderBy(desc(ideathons.createdAt)),
    db.select({ ideathonId: phases.ideathonId, total: count(evaluations.id), submitted: sql<number>`count(*) filter (where ${evaluations.status} = 'SUBMITTED')` }).from(phases).leftJoin(phaseIdeas, eq(phaseIdeas.phaseId, phases.id)).leftJoin(evaluations, eq(evaluations.phaseIdeaId, phaseIdeas.id)).groupBy(phases.ideathonId),
    db.select({ total: count(users.id) }).from(users).where(and(eq(users.role, "EVALUATOR"), eq(users.status, "ACTIVE"))),
    db.select({ total: count(evaluations.id) }).from(evaluations).where(eq(evaluations.status, "DRAFT")),
    db.select({ submittedAt: evaluations.submittedAt }).from(evaluations).where(and(eq(evaluations.status, "SUBMITTED"), gte(evaluations.submittedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))),
    db.select({ id: users.id, name: users.name, count: count(evaluations.id) }).from(users).innerJoin(evaluations, and(eq(evaluations.evaluatorId, users.id), eq(evaluations.status, "SUBMITTED"))).groupBy(users.id).orderBy(desc(count(evaluations.id))).limit(5),
  ]);

  const evaluationByIdeathon = new Map(evaluationRows.map((row) => [row.ideathonId, { total: Number(row.total), submitted: Number(row.submitted) }]));
  const data = eventRows.map((event) => {
    const evaluation = evaluationByIdeathon.get(event.id) || { total: 0, submitted: 0 };
    return { id: event.id, name: event.name, status: event.status, ideaCount: Number(event.ideaCount), progress: evaluation.total ? Math.round((evaluation.submitted / evaluation.total) * 100) : 0, totalEvaluations: evaluation.total, submittedEvaluations: evaluation.submitted };
  });
  const bars = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const value = recentSubmissions.filter((row) => row.submittedAt && new Date(row.submittedAt) >= date && new Date(row.submittedAt) < next).length;
    return { day: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), value, highlight: index === 6 };
  });

  return NextResponse.json({ data, reviewers: reviewerRows.map((reviewer) => ({ id: reviewer.id, name: reviewer.name, count: Number(reviewer.count) })), metrics: { activeIdeathons: data.filter((event) => event.status === "LIVE").length, totalIdeas: data.reduce((total, event) => total + event.ideaCount, 0), activeEvaluators: Number(evaluatorRows[0]?.total || 0), pendingEvaluations: Number(pendingRows[0]?.total || 0) }, submissionBars: bars });
}
