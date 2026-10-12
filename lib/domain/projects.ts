import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { LOCAL_USER_ID } from "@/lib/config";
import { prepareDb } from "@/lib/db/migrate";
import { getDb } from "@/lib/db/client";
import { auditEvents, jobs, projects } from "@/lib/db/schema";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { isValidSlug, slugify } from "@/lib/slug";
import { getTemplate } from "@/lib/templates/registry";

export type ProjectRow = typeof projects.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type AuditRow = typeof auditEvents.$inferSelect;

async function db() {
  await prepareDb();
  return getDb();
}

export async function recordAudit(
  action: string,
  projectId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const database = await db();
  await database.insert(auditEvents).values({
    ownerId: LOCAL_USER_ID,
    action,
    resourceType: "project",
    resourceId: projectId,
    metadata,
  });
}

export async function createProject(input: {
  name: string;
  description?: string | null;
  templateId: string;
  idempotencyKey?: string | null;
}): Promise<{ project: ProjectRow; job: JobRow }> {
  if (!rateLimit("create-project", 20, 60_000)) {
    throw new DomainError(
      "RATE_LIMITED",
      "Too many projects were created. Wait a minute and try again.",
      429,
    );
  }
  const name = input.name.trim();
  const description = input.description?.trim() ? input.description.trim() : null;
  if (!name || name.length > 60) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Enter a project name of 60 characters or fewer.",
    );
  }
  if (description && description.length > 300) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Keep the description under 300 characters.",
    );
  }
  const slug = slugify(name);
  if (!isValidSlug(slug)) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Use a name with letters or numbers so a project slug can be created.",
    );
  }
  const template = getTemplate(input.templateId);
  const database = await db();

  if (input.idempotencyKey) {
    const existing = await database
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.ownerId, LOCAL_USER_ID),
          eq(jobs.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);
    const job = existing[0];
    if (job) {
      const project = await getProject(job.projectId);
      return { project, job };
    }
  }

  let project: ProjectRow;
  try {
    const inserted = await database
      .insert(projects)
      .values({
        ownerId: LOCAL_USER_ID,
        name,
        slug,
        description,
        templateId: template.manifest.id,
        templateVersion: template.manifest.version,
      })
      .returning();
    const created = inserted[0];
    if (!created) {
      throw new DomainError("INTERNAL_ERROR", "The project was not saved.", 500);
    }
    project = created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DomainError(
        "CONFLICT",
        "A project with this name already exists. Choose a different name.",
        409,
      );
    }
    throw error;
  }

  const insertedJobs = await database
    .insert(jobs)
    .values({
      ownerId: LOCAL_USER_ID,
      projectId: project.id,
      type: "generate",
      status: "queued",
      idempotencyKey: input.idempotencyKey || null,
      inputJson: {
        templateId: template.manifest.id,
        templateVersion: template.manifest.version,
      },
    })
    .returning();
  const job = insertedJobs[0];
  if (!job) {
    throw new DomainError("INTERNAL_ERROR", "The build job was not saved.", 500);
  }
  await recordAudit("project.created", project.id, {
    slug,
    templateId: template.manifest.id,
    templateVersion: template.manifest.version,
    jobId: job.id,
  });
  return { project, job };
}

export async function listProjects(): Promise<
  Array<{ project: ProjectRow; latestJob: JobRow | null }>
> {
  const database = await db();
  const rows = await database
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, LOCAL_USER_ID), ne(projects.status, "deleted")))
    .orderBy(desc(projects.createdAt));
  if (rows.length === 0) return [];
  const jobRows = await database
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.ownerId, LOCAL_USER_ID),
        inArray(
          jobs.projectId,
          rows.map((row) => row.id),
        ),
      ),
    )
    .orderBy(desc(jobs.createdAt));
  const latest = new Map<string, JobRow>();
  for (const job of jobRows) {
    if (!latest.has(job.projectId)) latest.set(job.projectId, job);
  }
  return rows.map((project) => ({
    project,
    latestJob: latest.get(project.id) ?? null,
  }));
}

export async function getProject(projectId: string): Promise<ProjectRow> {
  const database = await db();
  const rows = await database
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, LOCAL_USER_ID)))
    .limit(1);
  const project = rows[0];
  if (!project || project.status === "deleted") {
    throw new DomainError("NOT_FOUND", "That project was not found.", 404);
  }
  return project;
}

export async function listActivity(projectId: string): Promise<AuditRow[]> {
  const database = await db();
  return database
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.ownerId, LOCAL_USER_ID),
        eq(auditEvents.resourceId, projectId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(10);
}

export async function enqueueGenerate(projectId: string): Promise<JobRow> {
  if (!rateLimit(`generate:${projectId}`, 10, 60_000)) {
    throw new DomainError(
      "RATE_LIMITED",
      "Too many builds were started. Wait a minute and try again.",
      429,
    );
  }
  const project = await getProject(projectId);
  const database = await db();
  const active = await database
    .select()
    .from(jobs)
    .where(and(eq(jobs.projectId, project.id), eq(jobs.ownerId, LOCAL_USER_ID)));
  if (active.some((job) => job.status === "queued" || job.status === "running")) {
    throw new DomainError(
      "CONFLICT",
      "A build is already queued or running for this project.",
      409,
    );
  }
  const inserted = await database
    .insert(jobs)
    .values({
      ownerId: LOCAL_USER_ID,
      projectId: project.id,
      type: "generate",
      status: "queued",
      inputJson: {
        templateId: project.templateId,
        templateVersion: project.templateVersion,
      },
    })
    .returning();
  const job = inserted[0];
  if (!job) {
    throw new DomainError("INTERNAL_ERROR", "The build job was not saved.", 500);
  }
  return job;
}
