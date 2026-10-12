import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { templatesDir } from "@/lib/config";
import { DomainError } from "@/lib/errors";
import { parseTemplateManifest } from "@/lib/templates/parse";
import type { TemplateManifest } from "@/lib/templates/schema";

export type TemplateRecord = {
  dir: string;
  manifest: TemplateManifest;
};

export function listTemplates(): TemplateRecord[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(templatesDir);
  } catch {
    return [];
  }
  const templates: TemplateRecord[] = [];
  for (const entry of entries) {
    const dir = path.join(templatesDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const manifestPath = path.join(dir, "foundry.template.json");
    try {
      statSync(manifestPath);
    } catch {
      continue;
    }
    const raw: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
    templates.push({
      dir,
      manifest: parseTemplateManifest(raw, manifestPath),
    });
  }
  return templates.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

export function getTemplate(id: string): TemplateRecord {
  const found = listTemplates().find((template) => template.manifest.id === id);
  if (!found) {
    throw new DomainError(
      "TEMPLATE_NOT_FOUND",
      "That template is not in the local registry.",
      404,
    );
  }
  return found;
}
