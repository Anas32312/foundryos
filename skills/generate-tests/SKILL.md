# Generate Tests

Add tests only for behavior already on the page. Do not change the offer to make a test pass.

1. If the site has no test runner, add Vitest as a dev dependency and a `test` script. Pin the version you install.
2. Render `app/page.tsx` and assert the site name is present, there is one `main`, and the contact link has an `href`.
3. Do not snapshot the whole page.
4. Run `npm test` and `npm run build`.
