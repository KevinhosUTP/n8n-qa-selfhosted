# KevoLint — frontend baseline and public shell (PR01–PR03)

Development baseline with PR02 design foundations and the PR03 public shell.
The landing, informational pages and provider integrations remain in later
handoff stages. This app has no audit endpoint or provider SDK.

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

The explicitly approved continuity policy allows only `develop` pushes and internal
same-repository PRs to `develop`, excluding fork PRs and PRs originating from main.
It validates the exact workflow path/ref: `frontend-checks.yml@refs/heads/develop`
for push, or `frontend-checks.yml@refs/pull/<number>/merge` for PR, including the
authorized repository and `.github/workflows/` prefix. Missing or contradictory
event/PR/checkout/workflow data fails closed. There is no acceptance in other workflows.

Main retains the complete pipeline, including exposure, build, smoke, physical
artifact inspection and full audit. Scanning does not itself grant an exception;
main's dependency check intentionally fails while vulnerable findings remain.
A strict clean report can pass without an exception, even after the exception has
expired; acceptance-eligible develop contexts still fail at expiry on clean reports.
Push checks on feature/codex branches are replaced by their PR checks; PR01 remains
Draft. Local diagnostic scope is unchanged and never grants Linux/CI acceptance.
Dependency/hash changes and all existing anomalies revoke acceptance per execution;
future PRs cannot silently renew it. Changes to controls require explicit review.

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
- `src/app/(public)`: PR04 supplies the eight public review pages; authentication and business features remain unimplemented.
- `src/app/not-found.tsx`: unknown paths return HTTP 404, without redirection to `/404`.
- Server Components by default; add `use client` only for required interaction.
- `@/*` maps to `src/*`; TypeScript remains strict.
- `src/lib/config/validation.ts`: pure validators, no logging or environment serialization.
- `public.ts`: explicit public lookup; `server.ts`: protected by `server-only`.
- No barrel re-export combining server and client configuration. Never spread
  `process.env` into Next config, React props, HTML, error messages or browser storage.
- No new UI libraries, font downloads, telemetry SDKs or API adapters. PR04 labels its static example as DEMO and all provisional commercial values as proposals.

Future route groups `(auth)` and `(private)/app` preserve the handoff's approved
URLs. They are documented, not scaffolded as accessible or supposedly protected
pages in PR01. Clerk catch-all routing is a PR06 decision. The future report is
`/app/auditorias/[id]`; overlays and contextual errors do not create new routes.

PR02 supplies local Inter typography, deterministic tokens and the original
R2/C3 + W3 SVGs. PR03 reuses those foundations for the public shell.

See [ADR 0001](../../docs/adr/0001-frontend-foundation.md) and the
[security backlog](../../docs/security-backlog.md).

## PR03 public layout

PR03 supplied the header, technical content and footer; PR04 replaces the technical content with public review pages.
Canonical destinations and their implementation stage are centralized in
`src/lib/navigation/public-routes.ts`. PR06 URLs remain real 404s;
commercial deployment remains blocked by missing authentication and unapproved D05/D08 content.

Run `npm run public:verify` for installed-browser navigation, modal lifecycle,
responsive and accessibility checks. Like PR02, it owns a temporary fixture,
removes it on exit and refuses a production build while it exists. No additional
package or browser is installed. See `docs/verification-pr03.md` for scope,
visual adaptations, evidence and limitations. The native modal boundary is
internal and can be reused by PR05 without duplicating dialog mechanics.

## PR04 public pages

Landing, Cómo funciona, Precios, Seguridad, Ayuda and the three legal review
templates reuse the existing design system and public layout. Plans are proposals,
legal text is a development draft and the report is static DEMO content.
There is no checkout, subscription, account recovery or fictitious backend action.

`npm run pages:verify` checks the prepared production standalone in the installed
browser, including 56 route/viewport samples, native FAQ, local help search and
its GET fallback without JavaScript. It runs after build/smoke; PR02 and PR03
browser suites remain mandatory. No package or browser is installed.

See `docs/verification-pr04.md`, `design-system/public-pages.json` and
`docs/pr04-evidence/` for frames, approved adaptations, captures and limitations.
SEC-PR01-01 is unchanged, temporarily accepted, not fixed, until
2026-10-31 23:59 America/Lima. Final acceptance requires the authorized Linux CI.
No merge or deployment is authorized by this implementation.
