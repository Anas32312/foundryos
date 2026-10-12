import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatWhen, statusLabel } from "@/components/format";
import { listProjects } from "@/lib/domain/projects";

export const instant = false;

export default function HomePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 max-w-xl text-muted">
        Generate an editable Next.js marketing site from a pinned template and prove it builds.
      </p>
      <Suspense fallback={<p className="mt-10">Loading projects…</p>}>
        <ProjectHome />
      </Suspense>
    </main>
  );
}

async function ProjectHome() {
  await connection();
  const rows = await listProjects();

  if (rows.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-line bg-panel p-8">
        <h2 className="text-lg font-medium">No projects yet</h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Create one from the marketing starter. FoundryOS copies the template, runs the production
          build, and gives you a ZIP you can ship without this app.
        </p>
        <Link
          href="/projects/new"
          className="mt-6 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          New project
        </Link>
      </div>
    );
  }

  return (
    <table className="mt-10 w-full border-collapse text-left text-sm">
      <caption className="sr-only">Your projects</caption>
      <thead>
        <tr className="border-b border-line text-muted">
          <th scope="col" className="py-2 pr-4 font-medium">
            Name
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Template
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Latest build
          </th>
          <th scope="col" className="py-2 font-medium">
            Created
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ project, latestJob }) => (
          <tr key={project.id} className="border-b border-line">
            <th scope="row" className="py-3 pr-4 font-medium">
              <Link
                href={`/projects/${project.id}`}
                className="underline decoration-line underline-offset-4"
              >
                {project.name}
              </Link>
              <span className="mt-1 block font-normal text-muted">{project.slug}</span>
            </th>
            <td className="py-3 pr-4">
              {project.templateId}@{project.templateVersion}
            </td>
            <td className="py-3 pr-4">{statusLabel(latestJob?.status ?? null)}</td>
            <td className="py-3">{formatWhen(project.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
