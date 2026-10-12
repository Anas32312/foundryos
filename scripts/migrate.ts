import { loadLocalEnv } from "@/lib/env";

loadLocalEnv();

async function main(): Promise<void> {
  const { prepareDb } = await import("@/lib/db/migrate");
  await prepareDb();
  console.log("Database is ready.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Migration failed.";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]"));
  process.exit(1);
});
