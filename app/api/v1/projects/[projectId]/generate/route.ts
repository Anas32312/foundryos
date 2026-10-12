import { apiError, apiOk, isUuid, withApi } from "@/lib/api";
import { enqueueGenerate } from "@/lib/domain/projects";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withApi(async (id) => {
    const { projectId } = await context.params;
    if (!isUuid(projectId)) return apiError(404, "NOT_FOUND", "That project was not found.", id);
    const job = await enqueueGenerate(projectId);
    return apiOk({ job: { id: job.id, status: job.status } }, id, 202);
  });
}
