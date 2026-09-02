import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle>;

const globalForDatabase = globalThis as unknown as {
  ideathonPool?: Pool;
  ideathonDb?: Database;
};

export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não foi definida.");
  }

  if (!globalForDatabase.ideathonDb) {
    globalForDatabase.ideathonPool ??= new Pool({ connectionString });
    globalForDatabase.ideathonDb = drizzle(globalForDatabase.ideathonPool, { schema });
  }

  return globalForDatabase.ideathonDb;
}

export async function closeDb() {
  await globalForDatabase.ideathonPool?.end();
  globalForDatabase.ideathonPool = undefined;
  globalForDatabase.ideathonDb = undefined;
}
