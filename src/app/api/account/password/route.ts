import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";

type PasswordRequest = {
  currentPassword?: string;
  newPassword?: string;
  confirmation?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  let body: PasswordRequest;
  try {
    body = await request.json() as PasswordRequest;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  const confirmation = String(body.confirmation ?? "");

  if (!currentPassword || newPassword.length < 8 || newPassword !== confirmation) {
    return NextResponse.json({ error: "Informe a senha atual e uma nova senha válida com pelo menos 8 caracteres." }, { status: 422 });
  }

  const db = getDb();
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash || !(await compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 422 });
  }

  await db
    .update(users)
    .set({
      passwordHash: await hash(newPassword, 12),
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
