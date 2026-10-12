import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { zipSync, type Zippable } from "fflate";
import { listProjectFiles } from "@/lib/generator/rewrite";
import { safeJoin } from "@/lib/paths";

export function zipWorkspace(workspace: string, artifactPath: string): number {
  const files = listProjectFiles(workspace).filter(
    (relative) =>
      !relative.startsWith("node_modules/") && !relative.startsWith(".next/"),
  );
  const archive: Zippable = {};
  for (const relative of files) {
    const absolute = safeJoin(workspace, relative);
    archive[relative] = new Uint8Array(readFileSync(absolute));
  }
  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, zipSync(archive, { level: 6 }));
  return files.length;
}
