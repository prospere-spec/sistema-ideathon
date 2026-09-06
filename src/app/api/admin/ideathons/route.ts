import { NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideas, ideathons } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { createDemoIdeathon, listDemoIdeathons } from "@/lib/demo-store";

function parseIdeathon(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Dados inválidos." };
  const body = input as Record<string, unknown>;
  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  if (name.length < 3 || !/^[a-z0-9-]+$/.test(slug)) return { error: "Informe um nome e slug válidos." };
  return { data: { name, slug, description: String(body.description || "").trim(), timezone: String(body.timezone || "America/Sao_Paulo"), createdBy: String(body.createdBy || "") } };
}

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  if (isDemoMode) return NextResponse.json({ data: listDemoIdeathons() });
  const db = getDb();
  const data = await db.select({ id: ideathons.id, name: ideathons.name, slug: ideathons.slug, description: ideathons.description, status: ideathons.status, timezone: ideathons.timezone, startsAt: ideathons.startsAt, endsAt: ideathons.endsAt, ideaCount: count(ideas.id) }).from(ideathons).leftJoin(ideas, eq(ideas.ideathonId, ideathons.id)).groupBy(ideathons.id).orderBy(asc(ideathons.createdAt));
  return NextResponse.json({ data: data.map((event) => ({ ...event, ideaCount: Number(event.ideaCount) })) });
}

export async function POST(request: Request) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const parsed = parseIdeathon({ ...(await request.json()), createdBy: user.id });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (isDemoMode) return NextResponse.json({ data: createDemoIdeathon(parsed.data) }, { status: 201 });
  const db = getDb();
  try {
    const [created] = await db.insert(ideathons).values({ ...parsed.data, createdBy: user.id }).returning();
    await db.insert(auditLogs).values({ actorUserId: user.id, action: "IDEATHON_CREATED", entityType: "IDEATHON", entityId: created.id, metadata: { ideathonId: created.id } });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "Este slug já está em uso." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível criar o ideathon." }, { status: 500 });
  }
}
