import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";
import { generateTemporaryPassword } from "@/lib/temporary-password";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  if (id === user.id && body.status === "INACTIVE") return NextResponse.json({ error: "Você não pode desativar seu próprio acesso." }, { status: 422 });
  const updates: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.email !== undefined) updates.email = String(body.email).trim().toLowerCase();
  if (body.role === "ADMIN" || body.role === "EVALUATOR") updates.role = body.role;
  if (body.status === "ACTIVE" || body.status === "INACTIVE") updates.status = body.status;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 422 });
  const db = getDb();
  try {
    const [updated] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, updatedAt: users.updatedAt });
    if (!updated) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    await db.insert(auditLogs).values({ actorUserId: user.id, action: "USER_UPDATED", entityType: "USER", entityId: id, metadata: { userId: id, fields: Object.keys(updates) } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível atualizar o usuário." }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  const temporaryPassword = generateTemporaryPassword();
  const db = getDb();

  try {
    const [updated] = await db.update(users).set({ passwordHash: await hash(temporaryPassword, 12), mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, updatedAt: users.updatedAt });
    if (!updated) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    await db.insert(auditLogs).values({ actorUserId: user.id, action: "USER_PASSWORD_RESET", entityType: "USER", entityId: id, metadata: { userId: id } });
    return NextResponse.json({ data: { ...updated, temporaryPassword } });
  } catch (error) {
    console.error("Failed to reset user password", error);
    return NextResponse.json({ error: "Não foi possível gerar uma nova senha temporária." }, { status: 500 });
  }
}
