import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JobPanel } from "@/components/job-panel";
import { SiteFolder } from "@/components/site-folder";
import { activityLabel, formatWhen } from "@/components/format";
import { isUuid } from "@/lib/api";
import { sitesDir } from "@/lib/config";
import { latestArtifact, latestJob, listLogs } from "@/lib/domain/jobs";
import { getProject, listActivity } from "@/lib/domain/projects";
import { DomainError } from "@/lib/errors";

export const instant = false;

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <Suspense fallback={<p>Loading project…</p>}>
        <ProjectDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProjectDetail({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await connection();
  const { projectId } = await params;
  if (!isUuid(projectId)) notFound();

  let project: Awaited<ReturnType<typeof getProject>>;
  try {
    project = await getProject(projectId);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const job = await latestJob(project.id);
  const logs = job ? await listLogs(job.id) : [];
  const artifact = await latestArtifact(project.id);
  const activity = await listActivity(project.id);

  return (
    <>
      <p className="text-sm text-muted">
        <Link href="/" className="underline decoration-line underline-offset-4">
          Projects
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{project.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {project.slug} · {project.templateId}@{project.templateVersion}
      </p>
      {project.description ? <p className="mt-4 max-w-xl">{project.description}</p> : null}
      {existsSync(path.join(sitesDir, project.id)) ? (
        <SiteFolder folder={path.join(sitesDir, project.id)} />
      ) : (
        <p className="mt-8 text-sm text-muted">
          Run a build to keep a local folder. Until then, download the ZIP.
        </p>
      )}
      <JobPanel
        key={`${job?.id ?? "none"}:${job?.status ?? "none"}:${logs.length}`}
        projectId={project.id}
        initial={
          job
            ? {
                id: job.id,
                status: job.status,
                errorMessage: job.errorMessage,
                logs: logs.map((line) => line.message),
                artifactReady: artifact?.jobId === job.id,
              }
            : null
        }
      />
      <section className="mt-10" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-medium">
          Activity
        </h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {activity.map((event) => (
              <li key={event.id} className="flex flex-wrap gap-x-3 gap-y-1">
                <span>{activityLabel(event.action)}</span>
                <span className="text-muted">{formatWhen(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
