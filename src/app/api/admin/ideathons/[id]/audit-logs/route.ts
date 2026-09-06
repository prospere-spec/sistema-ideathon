import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoAuditLogs } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const requestedLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 50;
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");
  if (isDemoMode) return NextResponse.json(getDemoAuditLogs(id, { limit, action, entityType }));
  const filters = [sql`${auditLogs.metadata}->>'ideathonId' = ${id}`];
  if (action) filters.push(eq(auditLogs.action, action));
  if (entityType) filters.push(eq(auditLogs.entityType, entityType));

  const db = getDb();
  const data = await db
    .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt, actor: users.name, actorEmail: users.email })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return NextResponse.json({ data });
}
