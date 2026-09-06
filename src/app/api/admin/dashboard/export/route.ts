import { NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ideas, ideathons } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoDashboard } from "@/lib/demo-store";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  if (isDemoMode) {
    const rows = demoDashboard().data;
    const csv = ["evento,status,ideias", ...rows.map((row) => [row.name, row.status, row.ideaCount].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    return new NextResponse(`\ufeff${csv}\n`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ideathons.csv" } });
  }
  const db = getDb();
  const rows = await db.select({ name: ideathons.name, status: ideathons.status, ideas: count(ideas.id) }).from(ideathons).leftJoin(ideas, and(eq(ideas.ideathonId, ideathons.id), eq(ideas.status, "ACTIVE"))).groupBy(ideathons.id).orderBy(desc(ideathons.createdAt));
  const csv = ["evento,status,ideias", ...rows.map((row) => [row.name, row.status, row.ideas].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
  return new NextResponse(`\ufeff${csv}\n`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ideathons.csv" } });
}
