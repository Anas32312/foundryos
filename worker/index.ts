import { loadLocalEnv } from "@/lib/env";

loadLocalEnv();

async function main(): Promise<void> {
  const { prepareDb } = await import("@/lib/db/migrate");
  const { claimNextJobId, failInterruptedJobs } = await import("@/lib/domain/jobs");
  const { executeGenerateJob } = await import("@/lib/generator/execute");

  await prepareDb();
  await failInterruptedJobs();
  console.log("[worker] watching for jobs");

  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (!stopped) {
    const jobId = await claimNextJobId();
    if (!jobId) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }
    console.log(`[worker] job ${jobId}`);
    await executeGenerateJob(jobId);
    console.log(`[worker] job ${jobId} finished`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Worker failed.";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]"));
  process.exit(1);
});
