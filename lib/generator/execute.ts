import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { artifactsDir, buildTimeoutMs, workspacesDir } from "@/lib/config";
import { runNpm } from "@/lib/generator/command";
import { copyTemplate } from "@/lib/generator/copy";
import {
  rewritePackageName,
  rewriteSiteConfig,
  writeProjectManifest,
} from "@/lib/generator/rewrite";
import { placeLocalSite } from "@/lib/generator/site";
import { zipWorkspace } from "@/lib/generator/zip";
import {
  appendLogs,
  completeJob,
  failJob,
  getJob,
  isJobCancelled,
  trimLogs,
} from "@/lib/domain/jobs";
import { getProject, recordAudit } from "@/lib/domain/projects";
import { DomainError } from "@/lib/errors";
import { assertInside } from "@/lib/paths";
import { getTemplate } from "@/lib/templates/registry";

function createLogger(jobId: string) {
  let chain: Promise<void> = Promise.resolve();
  const push = (line: string) => {
    chain = chain.then(() => appendLogs(jobId, [line]));
  };
  return {
    push,
    flush: () => chain,
  };
}

export async function executeGenerateJob(jobId: string): Promise<void> {
  const job = await getJob(jobId);
  const project = await getProject(job.projectId);
  const log = createLogger(jobId);
  let workspace = "";
  let built = false;

  try {
    if (await isJobCancelled(jobId)) return;
    const template = getTemplate(project.templateId);
    if (template.manifest.version !== project.templateVersion) {
      throw new DomainError(
        "TEMPLATE_INCOMPATIBLE",
        `This project is pinned to ${project.templateId}@${project.templateVersion}, but the template on disk is ${template.manifest.version}.`,
        409,
      );
    }
    log.push(`Using ${template.manifest.id}@${template.manifest.version}`);
    workspace = path.join(workspacesDir, project.id, job.id);
    assertInside(workspacesDir, workspace);
    rmSync(workspace, { recursive: true, force: true });
    mkdirSync(workspace, { recursive: true });
    copyTemplate(template.dir, workspace);
    rewritePackageName(workspace, project.slug);
    rewriteSiteConfig(workspace, project.name, project.description);
    const manifest = writeProjectManifest(workspace, {
      projectId: project.id,
      template: {
        id: template.manifest.id,
        version: template.manifest.version,
      },
      createdAt: new Date().toISOString(),
      features: [...template.manifest.features],
    });
    log.push(`Copied ${manifest.files.length} files`);

    const timeout = buildTimeoutMs();
    const stop = () => isJobCancelled(jobId);
    await runNpm(["ci"], workspace, timeout, log.push, stop);
    if (await stop()) return;
    await runNpm(["run", "lint"], workspace, timeout, log.push, stop);
    if (await stop()) return;
    await runNpm(["run", "build"], workspace, timeout, log.push, stop);
    if (await stop()) return;

    const artifactPath = path.join(artifactsDir, project.id, `${job.id}.zip`);
    assertInside(artifactsDir, artifactPath);
    const fileCount = zipWorkspace(workspace, artifactPath);
    const saved = await completeJob(jobId, {
      artifactFile: `${project.id}/${job.id}.zip`,
      fileCount,
      templateId: template.manifest.id,
      templateVersion: template.manifest.version,
    });
    if (saved) {
      built = true;
      await recordAudit("project.generated", project.id, { jobId, fileCount });
      try {
        const sitePath = placeLocalSite(workspace, project.id);
        workspace = "";
        log.push(`Local folder: ${sitePath}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not keep a local folder.";
        log.push(message);
        rmSync(workspace, { recursive: true, force: true });
      }
      log.push("Build finished. The ZIP is ready.");
    }
  } catch (error) {
    const code = error instanceof DomainError ? error.code : "INTERNAL_ERROR";
    const message =
      error instanceof Error
        ? error.message
        : "The job failed before it could finish.";
    if (code === "CANCELLED") {
      log.push("Cancelled.");
    } else if (!built) {
      const saved = await failJob(jobId, code, message);
      if (saved) {
        await recordAudit("project.generate_failed", project.id, {
          jobId,
          errorCode: code,
        });
      }
      log.push(message);
      if (!(error instanceof DomainError)) console.error("[worker]", message);
    }
    if (workspace && !built) {
      rmSync(path.join(workspace, "node_modules"), { recursive: true, force: true });
      rmSync(path.join(workspace, ".next"), { recursive: true, force: true });
    }
  } finally {
    await log.flush();
    await trimLogs(jobId);
  }
}
