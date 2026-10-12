import { apiError, apiOk, isUuid, withApi } from "@/lib/api";
import { getProject } from "@/lib/domain/projects";
import { latestJob } from "@/lib/domain/jobs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withApi(async (id) => {
    const { projectId } = await context.params;
    if (!isUuid(projectId)) return apiError(404, "NOT_FOUND", "That project was not found.", id);
    const project = await getProject(projectId);
    const job = await latestJob(project.id);
    return apiOk(
      {
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          templateId: project.templateId,
          templateVersion: project.templateVersion,
          createdAt: project.createdAt.toISOString(),
        },
        job: job
          ? {
              id: job.id,
              status: job.status,
              errorCode: job.errorCode,
              errorMessage: job.errorMessage,
            }
          : null,
      },
      id,
    );
  });
}
