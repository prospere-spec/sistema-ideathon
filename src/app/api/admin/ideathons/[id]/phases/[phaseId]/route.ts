import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluations, phaseIdeas, phases } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { deleteDemoPhase, patchDemoPhase } from "@/lib/demo-store";

type RouteContext = { params: Promise<{ id: string; phaseId: string }> };
type PhaseStatus = "DRAFT" | "READY" | "LIVE" | "CLOSED";

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Envie dados válidos para a fase." }, { status: 422 });
  const input = body as Record<string, unknown>;
  const name = input.name === undefined ? undefined : String(input.name).trim();
  const position = input.position === undefined ? undefined : Number(input.position);
  const status = input.status === undefined ? undefined : String(input.status) as PhaseStatus;
  if (name !== undefined && name.length < 2) return NextResponse.json({ error: "Informe um nome válido para a fase." }, { status: 422 });
  if (position !== undefined && (!Number.isInteger(position) || position < 0)) return NextResponse.json({ error: "A posição deve ser um inteiro não negativo." }, { status: 422 });
  if (status !== undefined && !["DRAFT", "READY", "LIVE", "CLOSED"].includes(status)) return NextResponse.json({ error: "Status de fase inválido." }, { status: 422 });
  if (isDemoMode) {
    const updated = patchDemoPhase(id, phaseId, { name, position, status });
    return updated ? NextResponse.json({ data: updated }) : NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  }
  const db = getDb();
  const [current] = await db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!current) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  const updates = { name: name ?? current.name, position: position ?? current.position, status: status ?? current.status, updatedAt: new Date() };
  try {
    const [updated] = await db.transaction(async (tx) => {
      const [phase] = await tx.update(phases).set(updates).where(eq(phases.id, phaseId)).returning();
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: updates.status === "LIVE" ? "PHASE_STARTED" : updates.status === "CLOSED" ? "PHASE_CLOSED" : "PHASE_UPDATED", entityType: "PHASE", entityId: phaseId, metadata: { ideathonId: id, phaseId, status: updates.status } });
      return [phase];
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update phase", error);
    return NextResponse.json({ error: "Não foi possível atualizar a fase. Verifique se já existe outra fase ao vivo ou com a mesma posição." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id, phaseId } = await params;
  if (isDemoMode) {
    const deleted = deleteDemoPhase(id, phaseId);
    return deleted ? NextResponse.json({ data: deleted }) : NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  }
  const db = getDb();
  const [current] = await db.select({ id: phases.id, status: phases.status }).from(phases).where(and(eq(phases.id, phaseId), eq(phases.ideathonId, id))).limit(1);
  if (!current) return NextResponse.json({ error: "Fase não encontrada." }, { status: 404 });
  if (current.status === "LIVE" || current.status === "CLOSED") return NextResponse.json({ error: "Fases ao vivo ou encerradas não podem ser removidas." }, { status: 409 });
  const [[ideaCount], [evaluationCount]] = await Promise.all([
    db.select({ value: count() }).from(phaseIdeas).where(eq(phaseIdeas.phaseId, phaseId)),
    db.select({ value: count() }).from(evaluations).innerJoin(phaseIdeas, eq(evaluations.phaseIdeaId, phaseIdeas.id)).where(eq(phaseIdeas.phaseId, phaseId)),
  ]);
  if (Number(ideaCount.value) || Number(evaluationCount.value)) return NextResponse.json({ error: "Esta fase já possui dados associados e não pode ser removida." }, { status: 409 });
  await db.transaction(async (tx) => {
    await tx.delete(phases).where(eq(phases.id, phaseId));
    await tx.insert(auditLogs).values({ actorUserId: user.id, action: "PHASE_DELETED", entityType: "PHASE", entityId: phaseId, metadata: { ideathonId: id, phaseId } });
  });
  return NextResponse.json({ data: { id: phaseId, deleted: true } });
}
