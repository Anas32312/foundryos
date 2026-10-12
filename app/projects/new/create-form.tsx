"use client";

import { useActionState } from "react";
import { createProjectAction, type CreateState } from "@/app/projects/new/actions";

type TemplateChoice = {
  id: string;
  name: string;
  version: string;
  description: string;
};

export function CreateForm({ templates }: { templates: TemplateChoice[] }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createProjectAction,
    null,
  );
  const only = templates.length === 1 ? templates[0] : null;

  return (
    <form action={action} className="mt-8 max-w-xl space-y-6" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Project name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2"
        />
        <p id="name-hint" className="mt-2 text-sm text-muted">
          This becomes the site title and the package name.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={300}
          rows={3}
          className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2"
        />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Template</legend>
        <div className="mt-3 space-y-3">
          {templates.map((template) => (
            <label
              key={template.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-line bg-panel p-4"
            >
              <input
                type="radio"
                name="templateId"
                value={template.id}
                defaultChecked={only ? true : template.id === templates[0]?.id}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">
                  {template.name}{" "}
                  <span className="font-normal text-muted">{template.version}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">{template.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || templates.length === 0}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
