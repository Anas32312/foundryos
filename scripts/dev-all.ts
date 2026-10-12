import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { loadLocalEnv } from "@/lib/env";

loadLocalEnv();

function databasePort(): number {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "postgres://127.0.0.1:54329/foundryos");
    return Number(url.port || 5432);
  } catch {
    return 54329;
  }
}

function portOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    const done = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function command(line: string): ChildProcess {
  return spawn(line, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
}

function exitCode(child: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function ensurePostgres(port: number): Promise<void> {
  if (await portOpen(port)) return;
  console.log(`[foundry] starting Postgres on port ${port}`);
  const compose = command("docker compose up -d");
  const code = await exitCode(compose);
  if (code !== 0) {
    console.error("Docker did not start Postgres. Start Docker, then run npm run db:up.");
    process.exit(code);
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await portOpen(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.error(`Postgres did not open port ${port}.`);
  process.exit(1);
}

function stopTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  child.kill("SIGTERM");
}

async function main(): Promise<void> {
  await ensurePostgres(databasePort());
  const next = command("npm run dev:next");
  const worker = command("npm run worker");
  let shuttingDown = false;
  const shutdown = (code: number) => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopTree(next);
    stopTree(worker);
    setTimeout(() => process.exit(code), 300);
  };
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  next.on("exit", (code) => shutdown(code ?? 0));
  worker.on("exit", (code) => {
    if (!shuttingDown) {
      console.error("[foundry] the worker stopped. Builds will stay queued until you start it again.");
      shutdown(code ?? 1);
    }
  });
}

void main();
