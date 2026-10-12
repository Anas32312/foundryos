# Release Checklist

Do not deploy. Report what is still manual.

1. `site.config.json` `url` is the public origin, with `https://` and no path.
2. `.gitignore` ignores `node_modules/`, `.next/`, and `next-env.d.ts`.
3. `README.md` says how to install and build. It does not contain secrets.
4. Run `npm run lint` and `npm run build`.
5. List anything a person still has to do on the host, such as connecting the repository.
