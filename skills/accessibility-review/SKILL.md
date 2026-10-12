# Accessibility Review

Read `app/page.tsx` and `app/layout.tsx`. Fix only defects you can point at in those files.

1. One `h1`. Later headings do not skip a level.
2. Every link and button has a name that still makes sense out of context.
3. The skip link targets the `main` element.
4. Focus styles stay visible. Do not remove outlines without a replacement.
5. Do not convey state by color alone.
6. Write a short note of what you changed, then run `npm run lint` and `npm run build`.
