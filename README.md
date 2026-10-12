# FoundryOS

Generate an editable Next.js marketing site from a pinned template and prove it builds.

This is a local tool for one developer. It copies `nextjs-marketing`, runs lint and a production build in a workspace, and gives you a ZIP. Cursor stays the editor. FoundryOS does not host the site.

## Status

Working: create a project, generate it, read the build log, download a ZIP.

Skills in `skills/` are open instruction packages. The app lists them. It does not run them.

Not in this version: login, a second template, a hosted AI agent, a skills runner, MCP, billing, or a marketplace.

Source is MIT. See [LICENSE](LICENSE).

## Prerequisites

- Node.js 24
- Docker, for Postgres

## Setup

```bash
npm install
npm run dev
```

`npm run dev` starts Postgres, the app, and the worker. Open http://localhost:3000.

The database URL is in `.env.example`. Local defaults use port **54329** so they do not collide with another Postgres.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Postgres, Next.js, and the worker |
| `npm run dev:next` | Next.js only |
| `npm run worker` | Build worker only |
| `npm run db:up` | Start Postgres |
| `npm run db:migrate` | Apply migrations and seed the local user |
| `npm test` | Unit tests |
| `npm run lint` | Lint the platform |
| `npm run typecheck` | Typecheck the platform |
| `npm run build` | Production build of the platform |

## Create a project

1. Open **New project**.
2. Name it and keep the marketing template.
3. Wait until the status is **Built**. The worker runs `npm ci`, `npm run lint`, and `npm run build`.
4. Download the ZIP, or open the local folder shown on the project page. The ZIP builds with FoundryOS uninstalled:

```bash
npm ci
npm run build
```

The local folder already has dependencies. Preview it with `npm run dev` in that folder. FoundryOS does not host the site.

If a build stays **Queued**, the worker is not running. Use `npm run dev`.

## Pain log

After the first generated site, these steps were still by hand:

1. Brand beyond the name and description. The contact email, site URL, and page copy stay on the template defaults.
2. Publishing. Create a git repo from the ZIP or local folder and connect Cloudflare Pages yourself.
3. Restarting the worker. Generator changes do not apply until `npm run dev` is started again.
4. Preview. It is a second terminal in the local folder, not a page inside FoundryOS.
5. Edits after the first build. Changing copy means editing the local folder. The app does not write those edits back.

## Add a template

Copy `templates/nextjs-marketing`, change `id` and `version` in `foundry.template.json`, and keep a lockfile. A template is usable when `npm run lint` and `npm run build` pass inside it. Projects stay pinned to the version they were created from.

## Security

See [SECURITY.md](SECURITY.md). Do not commit `.env.local`.
