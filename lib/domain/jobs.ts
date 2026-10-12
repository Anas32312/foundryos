import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { LOCAL_USER_ID } from "@/lib/config";
import { getDb } from "@/lib/db/client";
import { prepareDb } from "@/lib/db/migrate";
import { jobLogs, jobs } from "@/lib/db/schema";
import { recordAudit } from "@/lib/domain/projects";
import { DomainError } from "@/lib/errors";
import { redactLine } from "@/lib/redact";

export type JobRow = typeof jobs.$inferSelect;
export type LogRow = typeof jobLogs.$inferSelect;

async function database() {
  await prepareDb();
  return getDb();
}

function firstId(result: unknown): string | undefined {
  if (Array.isArray(result)) {
    const row = result[0] as { id?: string } | undefined;
    return row?.id;
  }
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows: Array<{ id?: string }> }).rows;
    return rows[0]?.id;
  }
  return undefined;
}

export async function claimNextJobId(): Promise<string | null> {
  const db = await database();
  const claimed = await db.execute(sql`
    UPDATE jobs
    SET status = 'running', started_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'queued'
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id
  `);
  return firstId(claimed) ?? null;
}

export async function failInterruptedJobs(): Promise<void> {
  const db = await database();
  await db
    .update(jobs)
    .set({
      status: "failed",
      errorCode: "JOB_FAILED",
      errorMessage: "The worker restarted before this job finished. Run it again.",
      finishedAt: new Date(),
    })
    .where(eq(jobs.status, "running"));
}

export async function getJob(jobId: string): Promise<JobRow> {
  const db = await database();
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.ownerId, LOCAL_USER_ID)))
    .limit(1);
  const job = rows[0];
  if (!job) throw new DomainError("NOT_FOUND", "That job was not found.", 404);
  return job;
}

export async function latestJob(projectId: string): Promise<JobRow | null> {
  const db = await database();
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.projectId, projectId), eq(jobs.ownerId, LOCAL_USER_ID)))
    .orderBy(desc(jobs.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listLogs(jobId: string): Promise<LogRow[]> {
  const db = await database();
  const rows = await db
    .select()
    .from(jobLogs)
    .where(eq(jobLogs.jobId, jobId))
    .orderBy(desc(jobLogs.createdAt))
    .limit(400);
  return rows.reverse();
}

export async function appendLogs(jobId: string, messages: string[]): Promise<void> {
  const clean = messages.map((message) => redactLine(message)).filter((message) => message.trim());
  if (clean.length === 0) return;
  const db = await database();
  await db.insert(jobLogs).values(
    clean.map((message) => ({
      jobId,
      level: "info" as const,
      message,
    })),
  );
}

export async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  return job.status === "cancelled";
}

export async function completeJob(
  jobId: string,
  result: Record<string, unknown>,
): Promise<boolean> {
  const db = await database();
  const updated = await db
    .update(jobs)
    .set({
      status: "succeeded",
      resultJson: result,
      errorCode: null,
      errorMessage: null,
      finishedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "running")))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

export async function failJob(
  jobId: string,
  code: string,
  message: string,
): Promise<boolean> {
  const db = await database();
  const updated = await db
    .update(jobs)
    .set({
      status: "failed",
      errorCode: code,
      errorMessage: redactLine(message),
      finishedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "running")))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

export async function requestCancel(jobId: string): Promise<JobRow> {
  const job = await getJob(jobId);
  if (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled") {
    throw new DomainError(
      "CONFLICT",
      "This build has already finished.",
      409,
    );
  }
  const db = await database();
  const updated = await db
    .update(jobs)
    .set({
      status: "cancelled",
      errorCode: "CANCELLED",
      errorMessage: "Cancelled before the build finished.",
      finishedAt: new Date(),
    })
    .where(
      and(
        eq(jobs.id, jobId),
        eq(jobs.ownerId, LOCAL_USER_ID),
        sql`${jobs.status} in ('queued', 'running')`,
      ),
    )
    .returning();
  const next = updated[0];
  if (!next) throw new DomainError("CONFLICT", "This build has already finished.", 409);
  await recordAudit("job.cancelled", job.projectId, { jobId });
  return next;
}

export async function trimLogs(jobId: string): Promise<void> {
  const db = await database();
  const stale = await db
    .select({ id: jobLogs.id })
    .from(jobLogs)
    .where(eq(jobLogs.jobId, jobId))
    .orderBy(desc(jobLogs.createdAt))
    .offset(400);
  if (stale.length === 0) return;
  await db.delete(jobLogs).where(
    inArray(
      jobLogs.id,
      stale.map((row) => row.id),
    ),
  );
  await appendLogs(jobId, ["Older log lines were trimmed."]);
}

export async function latestArtifact(
  projectId: string,
): Promise<{ jobId: string; artifactFile: string } | null> {
  const db = await database();
  const rows = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.projectId, projectId),
        eq(jobs.ownerId, LOCAL_USER_ID),
        eq(jobs.status, "succeeded"),
      ),
    )
    .orderBy(desc(jobs.createdAt));
  for (const job of rows) {
    const artifactFile = job.resultJson?.artifactFile;
    if (typeof artifactFile === "string" && artifactFile.length > 0) {
      return { jobId: job.id, artifactFile };
    }
  }
  return null;
}
