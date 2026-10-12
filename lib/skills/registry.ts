import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { skillsDir } from "@/lib/config";
import { parseSkillManifest } from "@/lib/skills/parse";
import type { SkillManifest } from "@/lib/skills/schema";

export type SkillRecord = {
  dir: string;
  instructions: string;
  manifest: SkillManifest;
};

export function listSkills(): SkillRecord[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(skillsDir);
  } catch {
    return [];
  }
  const skills: SkillRecord[] = [];
  for (const entry of entries) {
    const dir = path.join(skillsDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const manifestPath = path.join(dir, "foundry.skill.json");
    try {
      statSync(manifestPath);
    } catch {
      continue;
    }
    const raw: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
    const instructionsPath = path.join(dir, "SKILL.md");
    skills.push({
      dir,
      instructions: readFileSync(instructionsPath, "utf8"),
      manifest: parseSkillManifest(raw, manifestPath),
    });
  }
  return skills.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}
