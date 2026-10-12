import { createReadStream, existsSync } from "node:fs";
import { Readable } from "node:stream";
import { artifactsDir } from "@/lib/config";
import { apiError, isUuid, withApi } from "@/lib/api";
import { latestArtifact } from "@/lib/domain/jobs";
import { getProject, recordAudit } from "@/lib/domain/projects";
import { safeJoin } from "@/lib/paths";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withApi(async (id) => {
    const { projectId } = await context.params;
    if (!isUuid(projectId)) {
      return apiError(404, "NOT_FOUND", "That project was not found.", id);
    }
    const project = await getProject(projectId);
    const artifact = await latestArtifact(project.id);
    if (!artifact) {
      return apiError(404, "NOT_FOUND", "This project does not have a build yet.", id);
    }
    const full = safeJoin(artifactsDir, artifact.artifactFile);
    if (!existsSync(full)) {
      return apiError(404, "NOT_FOUND", "The ZIP for this build is missing. Run the build again.", id);
    }
    await recordAudit("project.exported", project.id, { jobId: artifact.jobId });
    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${project.slug}.zip"`,
        "x-request-id": id,
      },
    });
  });
}
