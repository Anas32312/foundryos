# Add SEO Basics

Edit the generated site. Do not call the network.

1. Read `site.config.json`. Set `name`, `description`, and `url` from the inputs. Keep `url` as an absolute `https://` origin.
2. In `app/layout.tsx`, set `metadata.title` and `metadata.description` from that file. Add `metadata.metadataBase` from `url`.
3. Keep `app/robots.ts` allowing crawl of `/` and pointing `sitemap` at `${url}/sitemap.xml`.
4. Keep `app/sitemap.ts` listing `/` with a fixed `lastModified`. Do not use `new Date()` at render time.
5. Run `npm run lint` and `npm run build`.
