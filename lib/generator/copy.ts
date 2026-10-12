import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { DomainError } from "@/lib/errors";
import { safeJoin } from "@/lib/paths";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const SKIP_FILES = new Set(["foundry.template.json", "next-env.d.ts"]);

export function copyTemplate(sourceRoot: string, destRoot: string): string[] {
  const copied: string[] = [];
  mkdirSync(destRoot, { recursive: true });

  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) {
        throw new DomainError(
          "TEMPLATE_INVALID",
          "The template contains a symlink, which is not allowed.",
          400,
        );
      }
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(current, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (SKIP_FILES.has(entry.name) && path.resolve(current) === path.resolve(sourceRoot)) {
        continue;
      }
      const absolute = path.join(current, entry.name);
      const relative = path.relative(sourceRoot, absolute);
      const target = safeJoin(destRoot, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(absolute, target);
      copied.push(relative.split(path.sep).join("/"));
    }
  };

  walk(sourceRoot);
  copied.sort();
  return copied;
}
