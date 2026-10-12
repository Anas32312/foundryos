import { apiOk, withApi } from "@/lib/api";
import { listSkills } from "@/lib/skills/registry";

export async function GET() {
  return withApi(async (id) => {
    return apiOk(
      {
        skills: listSkills().map((skill) => ({
          id: skill.manifest.id,
          name: skill.manifest.name,
          version: skill.manifest.version,
          description: skill.manifest.description,
          license: skill.manifest.license,
          execution: skill.manifest.execution.mode,
          writes: skill.manifest.permissions.filesystem.write,
        })),
      },
      id,
    );
  });
}
