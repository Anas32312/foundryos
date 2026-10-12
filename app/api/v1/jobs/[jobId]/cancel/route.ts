import { apiError, apiOk, isUuid, withApi } from "@/lib/api";
import { requestCancel } from "@/lib/domain/jobs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  return withApi(async (id) => {
    const { jobId } = await context.params;
    if (!isUuid(jobId)) return apiError(404, "NOT_FOUND", "That job was not found.", id);
    const job = await requestCancel(jobId);
    return apiOk({ job: { id: job.id, status: job.status } }, id);
  });
}
