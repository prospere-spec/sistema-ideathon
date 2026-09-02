import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { users } from "../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const name = process.env.SEED_ADMIN_NAME?.trim();
const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!name || !email || !password) {
  throw new Error("Defina SEED_ADMIN_NAME, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD.");
}

if (password.length < 8) {
  throw new Error("SEED_ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
}

async function seedAdmin() {
  const db = getDb();
  const passwordHash = await hash(password, 12);

  await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    });

  const [admin] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  console.log(`Administrador pronto: ${admin?.email} (${admin?.id})`);
}

seedAdmin()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
