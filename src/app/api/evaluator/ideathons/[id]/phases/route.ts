import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { phases } from "@/db/schema";
import { requireEvaluatorApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoEvaluatorPhases } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireEvaluatorApi();
  if (response) return response;
  const { id } = await params;
  if (isDemoMode) return NextResponse.json(getDemoEvaluatorPhases(id, user.id));
  const db = getDb();
  const data = await db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status }).from(phases).where(and(eq(phases.ideathonId, id), eq(phases.status, "LIVE"))).orderBy(asc(phases.position));
  return NextResponse.json({ data });
}
