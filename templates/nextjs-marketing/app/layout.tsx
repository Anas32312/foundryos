import type { Metadata } from "next";
import type { ReactNode } from "react";
import site from "../site.config.json";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">
        <a
          href="#main"
          className="absolute left-4 top-4 -translate-y-20 rounded-full bg-ink px-3 py-2 text-sm text-paper focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
