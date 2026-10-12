import { mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { sitesDir, workspacesDir } from "@/lib/config";
import { DomainError } from "@/lib/errors";
import { assertInside } from "@/lib/paths";

const projectIdPattern = /^[0-9a-f-]{36}$/i;

export function placeLocalSite(
  workspace: string,
  projectId: string,
  roots: { sitesDir: string; workspacesDir: string } = { sitesDir, workspacesDir },
): string {
  if (!projectIdPattern.test(projectId)) {
    throw new DomainError("PATH_ESCAPE", "A file path escaped the project workspace.", 400);
  }
  const site = path.join(roots.sitesDir, projectId);
  assertInside(roots.sitesDir, site);
  assertInside(roots.workspacesDir, workspace);
  mkdirSync(roots.sitesDir, { recursive: true });
  rmSync(site, { recursive: true, force: true });
  renameSync(workspace, site);
  return site;
}
