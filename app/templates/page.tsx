import type { Metadata } from "next";
import Link from "next/link";
import { listTemplates } from "@/lib/templates/registry";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  const templates = listTemplates();

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-2 max-w-xl text-muted">
        A project is pinned to the version it was created from. The file on disk is the only version
        until you add another.
      </p>
      {templates.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No templates yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {templates.map((template) => (
            <li key={template.manifest.id} className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="text-lg font-medium">
                {template.manifest.name}{" "}
                <span className="text-sm font-normal text-muted">{template.manifest.version}</span>
              </h2>
              <p className="mt-2 text-sm text-muted">{template.manifest.description}</p>
              <p className="mt-3 text-sm">
                {template.manifest.framework} · {template.manifest.language} ·{" "}
                {template.manifest.features.join(", ")}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">{template.manifest.entrypoint}</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
              >
                Create project
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
