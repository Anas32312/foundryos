import path from "node:path";

export const rootDir = process.cwd();
export const templatesDir = path.join(rootDir, "templates");
export const skillsDir = path.join(rootDir, "skills");
export const workspacesDir = path.join(rootDir, "data", "workspaces");
export const artifactsDir = path.join(rootDir, "data", "artifacts");
export const sitesDir = path.join(rootDir, "data", "sites");

/** One local user until a second person can open the app. */
export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";
export const LOCAL_USER_NAME = "Local";
export const GENERATOR_VERSION = "0.1.0";
export const DEFAULT_TEMPLATE_ID = "nextjs-marketing";

export function buildTimeoutMs(): number {
  const parsed = Number(process.env.BUILD_TIMEOUT_MS ?? 180_000);
  if (!Number.isFinite(parsed) || parsed < 10_000) return 180_000;
  return parsed;
}
