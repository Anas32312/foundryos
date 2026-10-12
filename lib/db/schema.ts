import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    templateId: text("template_id").notNull(),
    templateVersion: text("template_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("projects_owner_slug_unique").on(table.ownerId, table.slug),
    index("projects_owner_created_idx").on(table.ownerId, table.createdAt),
    check(
      "projects_status_check",
      sql`${table.status} in ('active', 'archived', 'deleted')`,
    ),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    type: text("type").notNull(),
    status: text("status").notNull().default("queued"),
    idempotencyKey: text("idempotency_key"),
    inputJson: jsonb("input_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("jobs_owner_idempotency_unique").on(
      table.ownerId,
      table.idempotencyKey,
    ),
    index("jobs_status_created_idx").on(table.status, table.createdAt),
    index("jobs_project_created_idx").on(table.projectId, table.createdAt),
    check("jobs_type_check", sql`${table.type} in ('generate')`),
    check(
      "jobs_status_check",
      sql`${table.status} in ('queued', 'running', 'succeeded', 'failed', 'cancelled')`,
    ),
  ],
);

export const jobLogs = pgTable(
  "job_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    level: text("level").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("job_logs_job_created_idx").on(table.jobId, table.createdAt),
    check("job_logs_level_check", sql`${table.level} in ('info', 'error')`),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_events_resource_idx").on(table.resourceType, table.resourceId),
  ],
);
