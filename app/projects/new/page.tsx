import type { Metadata } from "next";
import { CreateForm } from "@/app/projects/new/create-form";
import { listTemplates } from "@/lib/templates/registry";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  const templates = listTemplates().map((template) => ({
    id: template.manifest.id,
    name: template.manifest.name,
    version: template.manifest.version,
    description: template.manifest.description,
  }));

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New project</h1>
      <p className="mt-2 max-w-xl text-muted">
        Pick a pinned starter. FoundryOS writes a real Next.js project, then lint and the production
        build have to pass before you can download it.
      </p>
      {templates.length === 0 ? (
        <p role="alert" className="mt-8 text-sm text-danger">
          No templates are installed. Add one under templates/ and refresh.
        </p>
      ) : (
        <CreateForm templates={templates} />
      )}
    </main>
  );
}
