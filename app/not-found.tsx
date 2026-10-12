import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-muted">That project is not on this machine.</p>
      <Link href="/" className="mt-6 inline-flex text-sm underline decoration-line underline-offset-4">
        Back to projects
      </Link>
    </main>
  );
}
