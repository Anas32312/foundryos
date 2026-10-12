import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { LOCAL_USER_ID, LOCAL_USER_NAME, rootDir } from "@/lib/config";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

let pending: Promise<void> | null = null;

export function prepareDb(): Promise<void> {
  if (!pending) {
    pending = migrateAndSeed().catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function migrateAndSeed(): Promise<void> {
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(rootDir, "drizzle") });
  await db
    .insert(users)
    .values({ id: LOCAL_USER_ID, name: LOCAL_USER_NAME })
    .onConflictDoNothing();
}
