import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GENERATOR_VERSION } from "@/lib/config";
import { DomainError } from "@/lib/errors";
import { safeJoin } from "@/lib/paths";
import {
  projectManifestSchema,
  type ProjectManifest,
} from "@/lib/templates/schema";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const SKIP_FILES = new Set(["next-env.d.ts"]);

type PackageJson = { name?: string };
type SiteConfig = { name?: string; description?: string; url?: string };

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    throw new DomainError(
      "TEMPLATE_INVALID",
      `Could not read ${file} as JSON.`,
      400,
    );
  }
}

export function listProjectFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(current, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      const relative = path.relative(root, path.join(current, entry.name));
      files.push(relative.split(path.sep).join("/"));
    }
  };
  walk(root);
  files.sort();
  return files;
}

export function rewritePackageName(projectDir: string, slug: string): void {
  const file = safeJoin(projectDir, "package.json");
  const parsed = readJson(file);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new DomainError(
      "TEMPLATE_INVALID",
      "package.json must be a JSON object.",
      400,
    );
  }
  const pkg = parsed as PackageJson;
  pkg.name = slug;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function rewriteSiteConfig(
  projectDir: string,
  name: string,
  description: string | null,
): void {
  const file = safeJoin(projectDir, "site.config.json");
  const parsed = readJson(file);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new DomainError(
      "TEMPLATE_INVALID",
      "site.config.json must be a JSON object.",
      400,
    );
  }
  const config = parsed as SiteConfig;
  if (typeof config.name !== "string" || typeof config.description !== "string") {
    throw new DomainError(
      "TEMPLATE_INVALID",
      "site.config.json needs a name and a description.",
      400,
    );
  }
  config.name = name;
  if (description) config.description = description;
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

export function writeProjectManifest(
  projectDir: string,
  input: {
    projectId: string;
    template: { id: string; version: string };
    createdAt: string;
    features: string[];
  },
): ProjectManifest {
  const manifest: ProjectManifest = {
    schemaVersion: 1,
    platform: "foundryos",
    projectId: input.projectId,
    template: input.template,
    generatorVersion: GENERATOR_VERSION,
    createdAt: input.createdAt,
    features: input.features,
    filesManifestVersion: 1,
    files: [...listProjectFiles(projectDir), "foundry.json"].sort(),
  };
  const parsed = projectManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "The generated project manifest failed validation.",
      500,
    );
  }
  writeFileSync(
    safeJoin(projectDir, "foundry.json"),
    `${JSON.stringify(parsed.data, null, 2)}\n`,
  );
  return parsed.data;
}
