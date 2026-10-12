"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const offline = /ECONNREFUSED|DATABASE_URL|connect|timeout|authenticat/i.test(error.message);
  const safeMessage = error.message.includes("://")
    ? "The database connection failed."
    : error.message;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {offline ? "Postgres is not running" : "Something went wrong"}
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        {offline
          ? "Start the database with npm run db:up, or use npm run dev, which starts it for you. Then try again."
          : safeMessage || "Refresh the page. A failed build does not delete the project."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        Try again
      </button>
    </main>
  );
}
