# ADR 0001 — KevoLint frontend foundation

Date: 2026-10-17. Status: implemented for PR01; merge and deployment require user approval.

## Context and provenance

Base: `develop` at `967efe63bb6e0581f75972e44fd891840be053b6`.
The user approved Entrega 3C and then PR01, including selective reuse of draft
[PR #3](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/3) at
`b9bc4ca5624a439b8f27dec45ecedb66562881e5`. No merge or complete cherry-pick is used.

Reused and adapted:

| Source in PR #3 | Kept | PR01 adjustment |
| --- | --- | --- |
| `apps/web/package.json` | Next 16, React 19, npm and Next scripts | Exact patched versions, lockfile, quality scripts and toolchain declaration |
| `apps/web/tsconfig.json` | Strict mode, App Router plugin, bundler resolution, `@/*` | Formatting; Next-generated declarations ignored |
| `apps/web/next.config.ts` | Standalone output, disabled powered-by header | Environment validation and baseline response headers |
| `apps/web/src/app/layout.tsx` | Root HTML/body composition, Spanish, noindex | KevoLint metadata and server-only configuration validation |
| `.github/workflows/frontend-checks.yml` | Frontend-only workflow, npm, typecheck/build, read-only permissions and concurrency | Lockfile, pinned actions, unit/boundary/HTTP/security checks and `codex/**` |

Not imported: audit workspace, product CSS, provisional logo, audit DTOs, Basic
Auth example, BFF `/api/audits`, Dockerfile. PR #3 and its branch remain intact.
Python modules, tests, workflow and infrastructure remain unchanged.

## Decisions and compatibility (D09)

Use Node 22 and npm 10; the exact reproducible development versions are declared
in `apps/web/.nvmrc` and `package.json`. The package lock records the full resolved
dependency tree. Use `npm ci`; do not bypass peer dependencies with legacy flags.

Next 16.4.2 and matching React/React DOM 19.3.1 were verified in the npm registry.
Next's October 14 security notice identifies 16.4.1 as patched for its disclosed
upstream issues; 16.4.2 is the subsequent stable release used here. This does not
guarantee absence of future vulnerabilities. Audit the locked production and dev
dependencies in CI, failing on any reported severity or scanner failure.

The executed full audit found GHSA-vfj7-8cjw-p6xm in development tooling:
`@next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`.
The registry and advisory report no patched braces release as of 2026-10-17;
the current Next plugin canary also retains fast-glob. npm's forced fix would
downgrade the Next plugin to 14.2.35, which is not accepted blindly. SEC-PR01-01
is an explicit merge blocker. The dependency CI job remains failing until this
is resolved; no severity threshold change, advisory suppression, unstable upgrade
or dependency waiver has been applied. Other CI jobs run independently so the
remaining evidence is still available. A production-only audit is separately
reported and never substitutes for the required full audit.

ESLint 10 uses the official `@next/eslint-plugin-next` recommended/core-web-vitals
rules, compatible `typescript-eslint` and React Hooks rules. The umbrella
`eslint-config-next` was evaluated but its React/import/a11y plugins still declare
ESLint 9-only peers; it is not installed. This avoids both unsupported ESLint 9
and forced invalid ESLint 10 peers. Dedicated JSX accessibility plugin rules remain
a follow-up once compatible; the current minimal pages receive manual semantic review.
Vitest runs pure
configuration tests in Node. Compiler boundary checks and standalone HTTP checks
exercise Next itself; unit mocks do not establish authentication or backend safety.

No Clerk, Supabase, Sentry or Paddle SDK is installed. Their exact SDK compatibility
remains unverified and must be recorded when those stages are authorized.

## Route and configuration boundaries

Preserve one root layout and Server Components by default. `(public)` contains `/`.
Future `(auth)` owns `/sign-in` and `/sign-up`; future `(private)/app` owns the approved
application URLs. No private data, route guards or business endpoints exist yet.

Only an optional approved frontend origin is public. Reject unreviewed
`NEXT_PUBLIC_*` names before compilation and on server configuration reads.
Public URL validation rejects credentials, paths, queries, fragments, unapproved
hosts, non-HTTPS remote origins and remote custom ports. No domains are created.
Configuration errors are generic and never echo values. The server module uses
`server-only`; future callers must enforce authorization at the data boundary.

## Service responsibilities and future gates

| Service | Responsibility | PR01 status |
| --- | --- | --- |
| Next.js | Rendering, navigation, accessibility, public/server boundary; possible future BFF | Minimal local foundation only |
| Clerk | Identity lifecycle and session issuance | Not configured; backend must validate authenticated context |
| FastAPI | Authorization, audit execution, ownership, quotas and idempotent business operations | Read-only source inspection; unchanged |
| Supabase/PostgreSQL | Durable data and constraints/transactions; ownership enforcement according to approved access model | No SDK, schema, RLS or migration change |
| Sentry | Technical observability with payload/token/PII scrubbing and explicit replay policy | No SDK or event transmission |
| Paddle Billing | Future checkout, billing events and subscription provider | Architecture decision only |
| Coolify / Traefik | Deployment/runtime management, TLS and edge policy | Unchanged; no deployment |

The browser is never authoritative for identity, access permissions, audit ownership,
available quota, idempotency, subscription state or payment confirmation. These must
later be enforced by backend checks and durable database operations, not UI flags.

Source inspection of `apps/api/main.py` confirms GET `/health` and synchronous POST
`/api/v1/audits`: JSON `{workflow}` to `{engine_version, metrics, findings}`.
OpenAPI is disabled; no live endpoint or deployed schema was verified in PR01.
No audit IDs, persistence, quota ledger, Clerk verification or recovery contract
can be inferred from these endpoints. D01–D04 stay open before integration.

## Paddle Billing — future implementation, not an integration

- Checkout through Paddle; start tests in Sandbox.
- Backend verifies webhook signatures using the unmodified request body and secret.
- Persist provider event IDs and apply events idempotently, including out-of-order delivery.
- Persist subscription state and reconcile it with the provider; a browser return URL
  or client success callback must never activate a plan.
- Activate entitlements only after a valid backend-confirmed provider event/state.
- Define renewal, scheduled cancellation, failed-payment and recovery transitions.
- Keep private API keys and webhook secrets on the server; any future client token
  must be explicitly classified before adding it to the public allowlist.
- Commercial eligibility for operating this SaaS from Peru is **pending confirmation**.
  This ADR makes no eligibility, tax, pricing or legal assurance.

## Header ownership

Next owns the headers currently tested by the local runtime: `nosniff`,
`strict-origin-when-cross-origin`, disabled camera/microphone/geolocation and
development `X-Robots-Tag: noindex, nofollow`. It also disables `X-Powered-By`.

Traefik will own HTTP-to-HTTPS redirect and HSTS once authorized and TLS/domain
coverage are verified. Review includeSubDomains/preload separately. Do not emit
duplicate competing header policies at both layers; agree one owner per header.

CSP (including frame-ancestors), framing policy and COOP/COEP remain pending
evaluation against Clerk, Paddle checkout and Sentry requirements. No speculative
blocking or report-only CSP is shipped. CSP nonces, if selected, must be evaluated
against Next's inline scripts and rendering/caching model. No permissive wildcard
CORS, credential transport or authentication proxy is introduced as a substitute.

## References

- Approved `KevoLint-Entrega-3C-Handoff.zip`, `README-Codex.md`, handoff sections 3, 12, 14; PR01, D09 and ISSUE-HC-01.
- https://nextjs.org/blog/nextjs-security-update-october-14-2026
- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- https://nextjs.org/docs/app/guides/environment-variables
- https://nextjs.org/docs/app/guides/testing/vitest
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://docs.npmjs.com/cli/v10/commands/npm-ci/
