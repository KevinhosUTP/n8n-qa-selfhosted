# KevoLint — frontend foundation (PR01)

Minimal development baseline. The product interface, brand assets and integrations
are scheduled in later handoff stages. This app has no audit endpoint or provider SDK.

## Local development

Use Node 22.20.0 (`.nvmrc`) and npm 10.9.3. Run these commands inside `apps/web`:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No `.env.local` or external credentials are required.
`.env.example` documents the optional public origin. All other `NEXT_PUBLIC_*`
names are rejected, including empty values, until explicitly reviewed. Never add
credentials to this allowlist. Public variables are frozen into browser bundles
at build time; they are not runtime secrets.

## Verification

```sh
npm run lint
npm test
npm run test:boundary
npm run typecheck
npm run security:exposure
npm run build
npm run smoke
npm run security:artifact
npm run security:dependencies
```

Run the negative boundary test **before** the normal build: it intentionally
creates a temporary route, expects Next to reject a Client Component importing
`server-only`, then removes only that fixture. The subsequent build regenerates
the normal output. It does not start a server or deploy anything.

`smoke` launches the generated standalone Node server on a temporary loopback
port, copies its static chunks into the standalone artifact, and checks `/`, real
404 responses, security headers, same-origin script loading and a synthetic private
canary's absence from HTML/browser assets. It starts with an allowlisted OS
environment and no inherited provider credentials. The server is stopped on exit.
`npm start` prepares the same static assets and runs the standalone entrypoint;
it does not use the incompatible `next start` command for standalone output.
No Docker/deployment configuration is introduced here.

SEC-PR01-01 remains vulnerable and is temporarily accepted only under the versioned
policy in `.github/security/sec-pr01-01.json`: owner KevinhosUTP; expires October 31,
2026 at 23:59 America/Lima (November 1, 04:59 UTC). Review October 24 and 31.
No dependency or lint-rule change accompanies this exception. Full audit always
runs (including after expiry), with a 120-second timeout. Any additional finding,
unexpected graph/hash/context or scanner failure rejects acceptance. There is no
clock override. A clean audit is reported as `sin hallazgos`, not as a fix.

`security:exposure` checks every effectively linted file, preserves recommended
Next/Hooks/TypeScript checks and prohibits `settings.next.rootDir`. Run artifact
inspection **after smoke**, which prepares published assets. It scans the actual
standalone, static assets and required traces, including nested packages and links.
Reports under ignored `.tools/security/` contain revision, OS, build ID, lock hash,
inventory and results; GitHub also receives logs and step summaries. Local results
are explicitly local-only. CI accepts the risk only after successful Linux
foundation/artifact verification on the same revision. Never copy the exception
to production code or infer deployment approval from a passing check.

From the repository root, scan committed Git history with:

```sh
node scripts/scan-secrets.mjs
```

This downloads the pinned official Gitleaks CLI, verifies its release SHA-256,
and runs with redacted output. Network access and `tar` are required; no scanner
App, license key or service credentials are used. CI checks the full fetched
history; a local scan only covers locally available committed history. Uncommitted
files are not covered by `gitleaks git`; commit/stage review is still necessary.

The unchanged Python workflow runs on pull requests to `develop` and `main`.
See [verification evidence](../../docs/verification-pr01.md) for actual results,
not just the expected command list.

## Conventions

- `src/app/layout.tsx`: single root layout, Spanish language and development noindex metadata.
- `src/app/(public)/page.tsx`: only implemented product URL, `/`, with technical placeholder content.
- `src/app/not-found.tsx`: unknown paths return HTTP 404, without redirection to `/404`.
- Server Components by default; add `use client` only for required interaction.
- `@/*` maps to `src/*`; TypeScript remains strict.
- `src/lib/config/validation.ts`: pure validators, no logging or environment serialization.
- `public.ts`: explicit public lookup; `server.ts`: protected by `server-only`.
- No barrel re-export combining server and client configuration. Never spread
  `process.env` into Next config, React props, HTML, error messages or browser storage.
- No new UI libraries, font downloads, telemetry SDKs, API adapters or fake business data.

Future route groups `(auth)` and `(private)/app` preserve the handoff's approved
URLs. They are documented, not scaffolded as accessible or supposedly protected
pages in PR01. Clerk catch-all routing is a PR06 decision. The future report is
`/app/auditorias/[id]`; overlays and contextual errors do not create new routes.

The system font and minimal CSS are temporary technical scaffolding. PR02 will
integrate approved Inter typography, tokens and original R2/C3 + W3 SVGs.

See [ADR 0001](../../docs/adr/0001-frontend-foundation.md) and the
[security backlog](../../docs/security-backlog.md).
