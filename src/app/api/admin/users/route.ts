import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api-auth";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  const db = getDb();
  const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, updatedAt: users.updatedAt }).from(users).orderBy(asc(users.name));
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response } = await requireAdminApi();
  if (response) return response;
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role === "ADMIN" ? "ADMIN" : "EVALUATOR";
  const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (name.length < 2 || !email.includes("@")) return NextResponse.json({ error: "Informe nome e e-mail válidos." }, { status: 422 });
  const temporaryPassword = randomBytes(9).toString("base64url");
  const db = getDb();
  try {
    const [created] = await db.insert(users).values({ name, email, role, status, passwordHash: await hash(temporaryPassword, 12), mustChangePassword: true }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, updatedAt: users.updatedAt });
    await db.insert(auditLogs).values({ actorUserId: user.id, action: "USER_CREATED", entityType: "USER", entityId: created.id, metadata: { userId: created.id, role } });
    return NextResponse.json({ data: { ...created, temporaryPassword } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 500 });
  }
}
