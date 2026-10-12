import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { DomainError } from "@/lib/errors";
import { redactLine } from "@/lib/redact";

export function childEnv(): NodeJS.ProcessEnv {
  const allow = [
    "PATH",
    "Path",
    "SystemRoot",
    "windir",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "HOME",
    "HOMEDRIVE",
    "HOMEPATH",
    "APPDATA",
    "LOCALAPPDATA",
    "PATHEXT",
    "COMSPEC",
    "ProgramFiles",
    "ProgramData",
    "SystemDrive",
  ];
  const env = {
    CI: "1",
    NEXT_TELEMETRY_DISABLED: "1",
  } as unknown as NodeJS.ProcessEnv;
  for (const key of allow) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  return env;
}

function npmLaunch(args: string[]): { command: string; args: string[] } {
  const cli = path.join(
    path.dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );
  if (existsSync(cli)) return { command: process.execPath, args: [cli, ...args] };
  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args,
  };
}

function killProcessTree(pid: number): void {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // The process already exited.
    }
  }
}

export async function runNpm(
  args: string[],
  cwd: string,
  timeoutMs: number,
  onLine: (line: string) => void,
  shouldStop: () => Promise<boolean>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const handles: {
      timer?: ReturnType<typeof setTimeout>;
      watch?: ReturnType<typeof setInterval>;
    } = {};
    const finish = (error?: DomainError) => {
      if (settled) return;
      settled = true;
      if (handles.timer) clearTimeout(handles.timer);
      if (handles.watch) clearInterval(handles.watch);
      if (error) reject(error);
      else resolve();
    };

    let child: ReturnType<typeof spawn>;
    const launch = npmLaunch(args);
    try {
      child = spawn(launch.command, launch.args, {
        cwd,
        env: childEnv(),
        windowsHide: true,
        shell: false,
        detached: process.platform !== "win32",
      });
    } catch (error) {
      const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
      finish(
        new DomainError(
          "JOB_FAILED",
          missing
            ? "npm was not found. Install Node.js, then run this job again."
            : "The build command could not be started.",
          500,
        ),
      );
      return;
    }

    let buffer = "";
    const take = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        const clean = redactLine(line);
        if (clean.trim()) onLine(clean);
      }
    };
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", take);
    child.stderr?.on("data", take);
    child.on("error", (error: NodeJS.ErrnoException) => {
      finish(
        new DomainError(
          "JOB_FAILED",
          error.code === "ENOENT"
            ? "npm was not found. Install Node.js, then run this job again."
            : "The build command could not be started.",
          500,
        ),
      );
    });
    child.on("close", (code) => {
      if (buffer.trim()) onLine(redactLine(buffer));
      if (code === 0) {
        onLine(`npm ${args.join(" ")} exited 0`);
        finish();
        return;
      }
      finish(
        new DomainError(
          "JOB_FAILED",
          `npm ${args.join(" ")} failed. Read the log for the compiler error.`,
          500,
        ),
      );
    });

    handles.timer = setTimeout(() => {
      if (child.pid) killProcessTree(child.pid);
      finish(
        new DomainError(
          "JOB_TIMEOUT",
          "The build timed out. Run it again, or raise BUILD_TIMEOUT_MS.",
          500,
        ),
      );
    }, timeoutMs);

    handles.watch = setInterval(() => {
      void shouldStop().then((stop) => {
        if (!stop || settled) return;
        if (child.pid) killProcessTree(child.pid);
        finish(
          new DomainError("CANCELLED", "The job was cancelled.", 400),
        );
      });
    }, 1000);
  });
}
