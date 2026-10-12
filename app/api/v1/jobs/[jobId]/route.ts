import { apiError, apiOk, isUuid, withApi } from "@/lib/api";
import { getJob, latestArtifact, listLogs } from "@/lib/domain/jobs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  return withApi(async (id) => {
    const { jobId } = await context.params;
    if (!isUuid(jobId)) return apiError(404, "NOT_FOUND", "That job was not found.", id);
    const job = await getJob(jobId);
    const logs = await listLogs(job.id);
    const artifact = await latestArtifact(job.projectId);
    return apiOk(
      {
        job: {
          id: job.id,
          projectId: job.projectId,
          status: job.status,
          errorCode: job.errorCode,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt.toISOString(),
          startedAt: job.startedAt?.toISOString() ?? null,
          finishedAt: job.finishedAt?.toISOString() ?? null,
        },
        logs: logs.map((line) => ({
          level: line.level,
          message: line.message,
          createdAt: line.createdAt.toISOString(),
        })),
        artifactReady: artifact?.jobId === job.id,
      },
      id,
    );
  });
}
