# Add Contact Form

Stay static. Do not add an API route, a database, or a third-party form host.

1. In the contact region of `app/page.tsx`, add a form with name, email, and message fields. Each control has a visible label.
2. Set `action` to `mailto:` plus the input address and `method` to `post`. Use `encType="text/plain"`.
3. Keep the existing `mailto:` link as well, with the same address.
4. Run `npm run lint` and `npm run build`.
