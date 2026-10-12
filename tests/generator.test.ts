import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { unzipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import { copyTemplate } from "@/lib/generator/copy";
import {
  rewritePackageName,
  rewriteSiteConfig,
  writeProjectManifest,
} from "@/lib/generator/rewrite";
import { placeLocalSite } from "@/lib/generator/site";
import { zipWorkspace } from "@/lib/generator/zip";
import { DomainError } from "@/lib/errors";
import { safeJoin } from "@/lib/paths";
import { redactLine } from "@/lib/redact";
import { isValidSlug, slugify } from "@/lib/slug";
import { listSkills } from "@/lib/skills/registry";
import { listTemplates } from "@/lib/templates/registry";

const temps: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "foundry-"));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("slug", () => {
  it("makes a url slug from a name", () => {
    expect(slugify("Field Note Studio")).toBe("field-note-studio");
    expect(isValidSlug(slugify("Field Note Studio"))).toBe(true);
    expect(slugify("!!!")).toBe("");
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("../etc")).toBe(false);
  });
});

describe("paths", () => {
  it("rejects paths that leave the workspace", () => {
    const root = tempDir();
    expect(() => safeJoin(root, "../outside.txt")).toThrow(DomainError);
    expect(() => safeJoin(root, "src/../../outside.txt")).toThrow(DomainError);
    expect(safeJoin(root, "src/page.tsx")).toBe(path.resolve(root, "src/page.tsx"));
  });
});

describe("redact", () => {
  it("hides secrets and database urls", () => {
    expect(redactLine("password=hunter2")).toContain("[redacted]");
    expect(redactLine("postgres://foundry:foundry@localhost/db")).toBe(
      "postgres://[redacted]",
    );
  });
});

describe("templates", () => {
  it("loads the marketing starter manifest", () => {
    const templates = listTemplates();
    expect(templates.map((template) => template.manifest.id)).toContain("nextjs-marketing");
    const marketing = templates.find((template) => template.manifest.id === "nextjs-marketing");
    expect(marketing?.manifest.version).toBe("1.0.0");
    expect(marketing?.manifest.entrypoint).toBe("app/page.tsx");
  });
});

describe("skills", () => {
  it("loads the open instruction packages", () => {
    const skills = listSkills();
    expect(skills.map((skill) => skill.manifest.id).sort()).toEqual([
      "accessibility-review",
      "add-contact-form",
      "add-seo-basics",
      "create-landing-page",
      "generate-tests",
      "release-checklist",
    ]);
    for (const skill of skills) {
      expect(skill.manifest.license).toBe("MIT");
      expect(skill.manifest.execution.mode).toBe("instructions");
      expect(skill.manifest.sideEffects.external).toBe(false);
      expect(skill.instructions).toContain("# ");
    }
  });
});

describe("generator", () => {
  it("copies a template, rewrites config, and zips the source", () => {
    const source = tempDir();
    const dest = tempDir();
    writeFileSync(
      path.join(source, "package.json"),
      JSON.stringify({ name: "demo", version: "1.0.0" }),
    );
    writeFileSync(
      path.join(source, "site.config.json"),
      JSON.stringify({
        name: "Demo",
        description: "A starter description.",
        url: "https://example.com",
      }),
    );
    writeFileSync(path.join(source, "foundry.template.json"), "{}");
    writeFileSync(path.join(source, "next-env.d.ts"), "export {};\n");
    writeFileSync(path.join(source, "readme.txt"), "hello");

    const copied = copyTemplate(source, dest);
    expect(copied).toEqual(["package.json", "readme.txt", "site.config.json"]);
    rewritePackageName(dest, "field-note");
    rewriteSiteConfig(dest, "Field Note", "A site for Field Note.");
    const manifest = writeProjectManifest(dest, {
      projectId: "project-1",
      template: { id: "nextjs-marketing", version: "1.0.0" },
      createdAt: "2026-10-12T00:00:00.000Z",
      features: ["seo-basics"],
    });
    expect(manifest.files).toContain("foundry.json");
    expect(JSON.parse(readFileSync(path.join(dest, "package.json"), "utf8")).name).toBe(
      "field-note",
    );
    expect(JSON.parse(readFileSync(path.join(dest, "site.config.json"), "utf8")).name).toBe(
      "Field Note",
    );

    const zipPath = path.join(tempDir(), "site.zip");
    const count = zipWorkspace(dest, zipPath);
    expect(count).toBe(manifest.files.length);
    const unzipped = unzipSync(new Uint8Array(readFileSync(zipPath)));
    expect(unzipped["foundry.json"]).toBeDefined();
    expect(unzipped["foundry.template.json"]).toBeUndefined();
    expect(unzipped["next-env.d.ts"]).toBeUndefined();
  });

  it("moves a finished workspace into a stable site folder", () => {
    const workRoot = tempDir();
    const siteRoot = tempDir();
    const workspace = path.join(workRoot, "job");
    mkdirSync(workspace);
    writeFileSync(path.join(workspace, "package.json"), "{}");
    const projectId = "f3b1ede1-d830-4204-8060-20c00f729368";
    const placed = placeLocalSite(workspace, projectId, {
      sitesDir: siteRoot,
      workspacesDir: workRoot,
    });
    expect(placed).toBe(path.join(siteRoot, projectId));
    expect(readFileSync(path.join(placed, "package.json"), "utf8")).toBe("{}");
    expect(() =>
      placeLocalSite(path.join(workRoot, "other"), "..", {
        sitesDir: siteRoot,
        workspacesDir: workRoot,
      }),
    ).toThrow(DomainError);
  });
});
