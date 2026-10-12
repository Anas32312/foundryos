"use client";

import { useState } from "react";

export function SiteFolder({ folder }: { folder: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="mt-8" aria-labelledby="local-heading">
      <h2 id="local-heading" className="text-lg font-medium">
        Local folder
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        This build is on disk, including its dependencies. FoundryOS does not host it. In a
        terminal, run <code className="font-mono text-ink">npm run dev</code> in this folder.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="max-w-full overflow-auto rounded-xl border border-line bg-panel px-3 py-2 font-mono text-xs">
          {folder}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(folder).then(() => {
              setCopied(true);
            });
          }}
          className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium"
        >
          {copied ? "Copied" : "Copy path"}
        </button>
      </div>
    </section>
  );
}
