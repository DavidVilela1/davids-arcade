# Security policy

David's Arcade is a static website: no server code, no accounts, no cookies,
no analytics and no third-party requests. The only data it stores is a small
`localStorage` entry (`davids-arcade:v1`) with sound settings and which
secrets were found, kept in the visitor's own browser.

## Built-in protections

- A strict Content-Security-Policy and related headers are set in
  `vercel.json` (also applied by `npm run preview` so they can be tested
  locally).
- Content is rendered with `textContent`/`setAttribute` only — never
  `innerHTML`.
- Every link and media path passes through `src/lib/links.ts`, which allows
  only `https:`, `mailto:` and local paths. External links open with
  `rel="noopener noreferrer"`.
- No environment variables or secrets are needed. Never commit any.

## Reporting a vulnerability

Please report security issues privately to the maintainer using the contact
details on the site (Workshop → red phone), rather than opening a public
issue. Include steps to reproduce. You should receive a reply within a few
days.

## Keeping dependencies current

```bash
npm outdated
npm audit
```

Update, then run `npm run check` before deploying.
