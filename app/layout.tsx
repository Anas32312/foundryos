import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FoundryOS",
    template: "%s · FoundryOS",
  },
  description:
    "Generate an editable Next.js marketing site from a pinned template and prove it builds.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="absolute left-4 top-4 -translate-y-20 rounded-full bg-accent px-3 py-2 text-sm text-accent-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              FoundryOS
            </Link>
            <nav aria-label="Main" className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted hover:text-ink">
                Projects
              </Link>
              <Link href="/templates" className="text-muted hover:text-ink">
                Templates
              </Link>
              <Link href="/skills" className="text-muted hover:text-ink">
                Skills
              </Link>
            </nav>
            <Link
              href="/projects/new"
              className="ml-auto rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
            >
              New project
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
