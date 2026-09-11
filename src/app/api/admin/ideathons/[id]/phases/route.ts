import { NextResponse } from "next/server";
import { and, asc, eq, max } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, ideathons, phases } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { createDemoPhase, getDemoPhases } from "@/lib/demo-store";
import { hasValidPhaseDateRange, parsePhaseDates } from "@/lib/phase-dates";

type RouteContext = { params: Promise<{ id: string }> };
type PhaseStatus = "DRAFT" | "READY" | "LIVE" | "CLOSED";

function parsePhase(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Envie dados válidos para a fase." } as const;
  const body = input as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const position = body.position === undefined ? undefined : Number(body.position);
  if (name.length < 2) return { error: "Informe um nome válido para a fase." } as const;
  if (position !== undefined && (!Number.isInteger(position) || position < 0)) return { error: "A posição deve ser um inteiro não negativo." } as const;
  const dates = parsePhaseDates(body);
  if (!dates.ok) return { error: dates.error } as const;
  const startsAt = dates.data.startsAt ?? null;
  const endsAt = dates.data.endsAt ?? null;
  if (!hasValidPhaseDateRange(startsAt, endsAt)) return { error: "O término da fase deve ser posterior ao início." } as const;
  return { data: { name, position, startsAt, endsAt } } as const;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  if (isDemoMode) {
    const data = getDemoPhases(id);
    return data ? NextResponse.json(data) : NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  }
  const db = getDb();
  const [ideathon] = await db.select({ id: ideathons.id, name: ideathons.name, timezone: ideathons.timezone }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!ideathon) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  const data = await db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status, startsAt: phases.startsAt, endsAt: phases.endsAt }).from(phases).where(eq(phases.ideathonId, id)).orderBy(asc(phases.position));
  return NextResponse.json({ ideathon, data });
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
  const parsed = parsePhase(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (isDemoMode) {
    const created = createDemoPhase(id, parsed.data);
    return created ? NextResponse.json({ data: created }, { status: 201 }) : NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  }
  const db = getDb();
  const [ideathon] = await db.select({ id: ideathons.id }).from(ideathons).where(eq(ideathons.id, id)).limit(1);
  if (!ideathon) return NextResponse.json({ error: "Ideathon não encontrado." }, { status: 404 });
  const [lastPosition] = await db.select({ position: max(phases.position) }).from(phases).where(eq(phases.ideathonId, id));
  const position = parsed.data.position ?? (lastPosition.position === null ? 0 : Number(lastPosition.position) + 1);
  try {
    const created = await db.transaction(async (tx) => {
      const [phase] = await tx.insert(phases).values({ ideathonId: id, name: parsed.data.name, position, startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt }).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: "PHASE_CREATED", entityType: "PHASE", entityId: phase.id, metadata: { ideathonId: id, phaseId: phase.id } });
      return phase;
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create phase", error);
    return NextResponse.json({ error: "Não foi possível criar a fase. Verifique se a posição já existe." }, { status: 409 });
  }
}
