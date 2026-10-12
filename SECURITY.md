# Security

FoundryOS is a local single-user tool. Do not expose `npm run dev` to the public internet.

- Generation writes only under `data/workspaces`. Paths that leave that directory are rejected.
- Template symlinks are rejected.
- `npm ci`, lint, and build run with a timeout and an environment that does not include `DATABASE_URL`.
- Logs redact database URLs and values that look like secrets. Do not put real secrets in a template.
- Only templates in this repository are expanded. Do not point the generator at a folder you have not reviewed.
- Create, build, failure, cancel, and ZIP download write an audit row.

There is no public security contact yet. Until there is one, report issues to the repository owner.
