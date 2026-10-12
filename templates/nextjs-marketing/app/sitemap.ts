import type { MetadataRoute } from "next";
import site from "../site.config.json";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date("2026-10-12T00:00:00.000Z"),
    },
  ];
}
