"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isActiveStatus, statusLabel } from "@/components/format";

type JobState = {
  id: string;
  status: string;
  errorMessage: string | null;
  logs: string[];
  artifactReady: boolean;
};

export function JobPanel({
  projectId,
  initial,
}: {
  projectId: string;
  initial: JobState | null;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const jobId = job?.id ?? null;
  const status = job?.status ?? null;

  useEffect(() => {
    if (!jobId || !isActiveStatus(status)) return;
    let stopped = false;
    const tick = async () => {
      const response = await fetch(`/api/v1/jobs/${jobId}`);
      if (!response.ok || stopped) return;
      const body = (await response.json()) as {
        ok?: boolean;
        job?: { status: string; errorMessage: string | null };
        logs?: Array<{ message: string }>;
        artifactReady?: boolean;
      };
      if (!body.ok || !body.job || stopped) return;
      const next = {
        id: jobId,
        status: body.job.status,
        errorMessage: body.job.errorMessage,
        logs: (body.logs ?? []).map((line) => line.message),
        artifactReady: Boolean(body.artifactReady),
      };
      setJob(next);
      if (!isActiveStatus(next.status)) router.refresh();
    };
    const timer = setInterval(() => void tick(), 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [jobId, status, router]);

  async function post(url: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(url, { method: "POST" });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
        job?: { id: string; status: string };
      };
      if (!response.ok || !body.ok) {
        setNotice(body.error?.message ?? "The request failed.");
        return;
      }
      if (body.job) {
        setJob({
          id: body.job.id,
          status: body.job.status,
          errorMessage: null,
          logs: [],
          artifactReady: false,
        });
      }
      router.refresh();
    } catch {
      setNotice("The request failed. Check that the app is still running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8" aria-labelledby="build-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="build-heading" className="text-lg font-medium">
          Build
        </h2>
        <p aria-live="polite" className="text-sm text-muted">
          Status: {statusLabel(job?.status ?? null)}
        </p>
      </div>
      {job?.status === "queued" ? (
        <p className="mt-3 text-sm text-muted">
          Queued builds start within a second when the worker is running. Use{" "}
          <code className="font-mono text-ink">npm run dev</code> so the worker stays up.
        </p>
      ) : null}
      {job?.errorMessage ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {job.errorMessage}
        </p>
      ) : null}
      {notice ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {notice}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {job?.artifactReady ? (
          <a
            href={`/api/v1/projects/${projectId}/export`}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
          >
            Download ZIP
          </a>
        ) : null}
        <button
          type="button"
          disabled={busy || isActiveStatus(job?.status ?? null)}
          onClick={() => void post(`/api/v1/projects/${projectId}/generate`)}
          className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {job ? "Run again" : "Run build"}
        </button>
        {job && isActiveStatus(job.status) ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void post(`/api/v1/jobs/${job.id}/cancel`)}
            className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <h3 className="mt-8 text-sm font-medium">Log</h3>
      <pre
        aria-label="Build log"
        className="mt-2 max-h-96 overflow-auto rounded-xl border border-line bg-panel p-4 font-mono text-xs leading-5 text-ink"
      >
        {job && job.logs.length > 0 ? job.logs.join("\n") : "No log lines yet."}
      </pre>
    </section>
  );
}
