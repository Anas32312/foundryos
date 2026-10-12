import path from "node:path";
import { DomainError } from "@/lib/errors";

export function safeJoin(root: string, relativePath: string): string {
  if (relativePath.includes("\0")) {
    throw new DomainError(
      "PATH_ESCAPE",
      "A file path escaped the project workspace.",
      400,
    );
  }
  const normalized = path.normalize(relativePath);
  if (path.isAbsolute(normalized)) {
    throw new DomainError(
      "PATH_ESCAPE",
      "A file path escaped the project workspace.",
      400,
    );
  }
  if (normalized.split(path.sep).includes("..")) {
    throw new DomainError(
      "PATH_ESCAPE",
      "A file path escaped the project workspace.",
      400,
    );
  }
  const full = path.resolve(root, normalized);
  const relative = path.relative(path.resolve(root), full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DomainError(
      "PATH_ESCAPE",
      "A file path escaped the project workspace.",
      400,
    );
  }
  return full;
}

export function assertInside(root: string, target: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DomainError(
      "PATH_ESCAPE",
      "A file path escaped the project workspace.",
      400,
    );
  }
}
