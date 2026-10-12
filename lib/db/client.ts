import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DomainError } from "@/lib/errors";
import * as schema from "@/lib/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | null = null;
let database: Database | null = null;

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new DomainError(
      "INTERNAL_ERROR",
      "DATABASE_URL is not set. Copy .env.example to .env.local.",
      500,
    );
  }
  if (!database || !client) {
    client = postgres(url, { max: 5, connect_timeout: 5, idle_timeout: 20 });
    database = drizzle(client, { schema });
  }
  return database;
}

export async function closeDb(): Promise<void> {
  if (client) await client.end({ timeout: 5 });
  client = null;
  database = null;
}
