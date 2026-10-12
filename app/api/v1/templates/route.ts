import { apiOk, withApi } from "@/lib/api";
import { listTemplates } from "@/lib/templates/registry";

export async function GET() {
  return withApi(async (id) => {
    return apiOk(
      {
        templates: listTemplates().map((template) => ({
          id: template.manifest.id,
          name: template.manifest.name,
          version: template.manifest.version,
          description: template.manifest.description,
          framework: template.manifest.framework,
          features: template.manifest.features,
          entrypoint: template.manifest.entrypoint,
        })),
      },
      id,
    );
  });
}
