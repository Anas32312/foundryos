import { DomainError } from "@/lib/errors";
import { skillManifestSchema, type SkillManifest } from "@/lib/skills/schema";

export function parseSkillManifest(data: unknown, filePath: string): SkillManifest {
  const parsed = skillManifestSchema.safeParse(data);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => {
        const where = issue.path.map(String).join(".") || "manifest";
        return `${where}: ${issue.message}`;
      })
      .join("; ");
    throw new DomainError(
      "VALIDATION_ERROR",
      `Skill manifest ${filePath} is invalid. ${detail}`,
      500,
    );
  }
  return parsed.data;
}
