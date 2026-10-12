import { DEFAULT_TEMPLATE_ID } from "@/lib/config";
import { apiOk, withApi } from "@/lib/api";
import { createProject, listProjects } from "@/lib/domain/projects";

export async function GET() {
  return withApi(async (id) => {
    const rows = await listProjects();
    return apiOk(
      {
        projects: rows.map(({ project, latestJob }) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          status: project.status,
          templateId: project.templateId,
          templateVersion: project.templateVersion,
          createdAt: project.createdAt.toISOString(),
          latestJob: latestJob
            ? { id: latestJob.id, status: latestJob.status }
            : null,
        })),
      },
      id,
    );
  });
}

export async function POST(request: Request) {
  return withApi(async (id) => {
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      description?: unknown;
      templateId?: unknown;
    } | null;
    const created = await createProject({
      name: typeof body?.name === "string" ? body.name : "",
      description: typeof body?.description === "string" ? body.description : null,
      templateId:
        typeof body?.templateId === "string" && body.templateId
          ? body.templateId
          : DEFAULT_TEMPLATE_ID,
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    return apiOk(
      {
        project: {
          id: created.project.id,
          name: created.project.name,
          slug: created.project.slug,
        },
        job: { id: created.job.id, status: created.job.status },
      },
      id,
      201,
    );
  });
}
