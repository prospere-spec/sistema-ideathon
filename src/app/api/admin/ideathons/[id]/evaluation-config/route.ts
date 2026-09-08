import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, evaluationConfigs, evaluationCriteria, phases, scaleLevels } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };
type CriterionInput = { id?: string; name: string; description: string; weight: number };
type ScaleInput = { value: number; label: string; description: string };

async function loadConfig(ideathonId: string, requestedPhaseId?: string | null) {
  const db = getDb();
  const phaseRows = await db.select({ id: phases.id, name: phases.name, position: phases.position, status: phases.status }).from(phases).where(eq(phases.ideathonId, ideathonId)).orderBy(asc(phases.position));
  const phase = (requestedPhaseId && phaseRows.find((row) => row.id === requestedPhaseId)) || phaseRows.find((row) => row.status === "LIVE") || phaseRows[0];
  if (!phase) return { phaseRows, phase: null, config: null, criteria: [], scale: [] };
  const [config] = await db.select({ id: evaluationConfigs.id, phaseId: evaluationConfigs.phaseId, version: evaluationConfigs.version, status: evaluationConfigs.status }).from(evaluationConfigs).where(eq(evaluationConfigs.phaseId, phase.id)).orderBy(desc(evaluationConfigs.version)).limit(1);
  if (!config) return { phaseRows, phase, config: null, criteria: [], scale: [] };
  const [criteria, scale] = await Promise.all([
    db.select({ id: evaluationCriteria.id, name: evaluationCriteria.name, description: evaluationCriteria.description, position: evaluationCriteria.position, weight: evaluationCriteria.weight }).from(evaluationCriteria).where(eq(evaluationCriteria.evaluationConfigId, config.id)).orderBy(asc(evaluationCriteria.position)),
    db.select({ value: scaleLevels.value, label: scaleLevels.label, description: scaleLevels.description }).from(scaleLevels).where(eq(scaleLevels.evaluationConfigId, config.id)).orderBy(asc(scaleLevels.value)),
  ]);
  return { phaseRows, phase, config, criteria, scale };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const data = await loadConfig(id, new URL(request.url).searchParams.get("phaseId"));
  if (!data.phaseRows.length) return NextResponse.json({ error: "Nenhuma fase encontrada neste ideathon." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const body = await request.json() as { phaseId?: string; criteria?: CriterionInput[]; scale?: ScaleInput[] };
  const criteria = body.criteria || [];
  const scale = body.scale || [];
  if (!body.phaseId || !criteria.length || criteria.some((item) => !item.name.trim() || !item.description.trim() || !Number.isInteger(item.weight) || item.weight <= 0 || item.weight > 100) || criteria.reduce((total, item) => total + item.weight, 0) !== 100) return NextResponse.json({ error: "Informe critérios válidos e pesos cuja soma seja 100%." }, { status: 422 });
  if (scale.length !== 5 || scale.some((item, index) => item.value !== index + 1 || !item.label.trim() || !item.description.trim())) return NextResponse.json({ error: "A escala precisa ter cinco níveis válidos." }, { status: 422 });
  const db = getDb();
  try {
    const result = await db.transaction(async (tx) => {
      const [phase] = await tx.select({ id: phases.id }).from(phases).where(and(eq(phases.id, body.phaseId as string), eq(phases.ideathonId, id))).limit(1);
      if (!phase) return { error: "Fase não encontrada neste ideathon.", status: 404 } as const;
      const [latest] = await tx.select({ id: evaluationConfigs.id, version: evaluationConfigs.version, status: evaluationConfigs.status }).from(evaluationConfigs).where(eq(evaluationConfigs.phaseId, phase.id)).orderBy(desc(evaluationConfigs.version)).limit(1);
      let configId: string;
      if (latest?.status === "DRAFT") {
        configId = latest.id;
        await tx.update(evaluationConfigs).set({ status: "PUBLISHED", publishedAt: new Date(), updatedAt: new Date() }).where(eq(evaluationConfigs.id, configId));
        await tx.delete(evaluationCriteria).where(eq(evaluationCriteria.evaluationConfigId, configId));
        await tx.delete(scaleLevels).where(eq(scaleLevels.evaluationConfigId, configId));
      } else {
        const [created] = await tx.insert(evaluationConfigs).values({ phaseId: phase.id, version: (latest?.version || 0) + 1, status: "PUBLISHED", publishedAt: new Date() }).returning({ id: evaluationConfigs.id });
        configId = created.id;
      }
      await tx.insert(evaluationCriteria).values(criteria.map((item, index) => ({ evaluationConfigId: configId, name: item.name.trim(), description: item.description.trim(), position: index, weight: item.weight })));
      await tx.insert(scaleLevels).values(scale.map((item) => ({ evaluationConfigId: configId, value: item.value, label: item.label.trim(), description: item.description.trim() })));
      await tx.insert(auditLogs).values({ actorUserId: user.id, action: "EVALUATION_CONFIG_SAVED", entityType: "EVALUATION_CONFIG", entityId: configId, metadata: { ideathonId: id, phaseId: phase.id, version: (latest?.status === "DRAFT" ? latest.version : (latest?.version || 0) + 1) } });
      return { data: { id: configId } } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ data: await loadConfig(id, body.phaseId) });
  } catch (error) {
    console.error("Failed to save evaluation config", error);
    return NextResponse.json({ error: "Não foi possível salvar a configuração." }, { status: 500 });
  }
}
