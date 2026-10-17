# Security and implementation gates after PR01

No item below is satisfied by the development placeholder or a successful build.
No backend, provider, DNS, deployment or production change is authorized by this file.

| Gate | Required evidence / future stage | Current state |
| --- | --- | --- |
| SEC-PR01-01 / conditional security gate | Enforce the approved, expiring acceptance below, including full audit and physical Linux artifact inspection on the latest commit | Temporarily accepted, **not fixed**; develop-continuity controls validated in Linux on `d0d748a` (verification report); all latest GitHub checks remain mandatory |
| ISSUE-HC-01 / D12 | Resolve destructive-button high-contrast text (reported 2.18:1) and test effective states before enabling the theme; PR02/05/14 | Open; theme not offered; approved R2/C3 + W3 assets unchanged |
| D09 SDK follow-up | Verify exact Clerk/Sentry/Supabase/Paddle SDK compatibility when needed | No provider SDK installed |
| D01 / D04 | Actual deployed contract, sanitized examples, errors, profiles, sync lifecycle, owned list/report/expiry APIs; PR10–12 | Only source-level synchronous API inspected; no live/OpenAPI verification |
| D02 | Clerk tenant, validated issuer/JWKS/audience/authorized parties, backend authorization, BFF versus direct transport, CSRF/CORS and session/cache isolation; PR06/10 | Open; no auth or protected data yet |
| D03 | Durable atomic quota reservation/commit/release and idempotent recovery; enforce ownership in backend/DB | Open; no local quota/security simulation |
| D05 / Paddle | Commercial eligibility from Peru, catalog/currency/tax/provider terms, Sandbox, signed webhooks, idempotency, persistence and backend-confirmed entitlements | Open; documentation only; no checkout or keys |
| D06–08 | Retention, period/timezone authority, legal approval, privacy/deletion/cancellation policies | Open; no legal or commercial claims published |
| PR02 | Approved Inter loading/licensing, 61 tokens, original brand SVGs and responsive design | Open; system-font technical placeholder only |
| Observability | Sentry data scrubbing; no workflow JSON, evidence, JWT, Authorization, payment data or replay without explicit policy | Open; SDK absent |
| Browser policy | Evaluate CSP, frame policy and COOP/COEP with selected provider flows; avoid conflicting edge/app policies | Open; no CSP shipped |
| Edge policy | Authorized Traefik HTTPS redirect/HSTS, policy ownership, rate limits and trusted proxy handling | Open; no infrastructure touched |
| Production release | Full authorized integration/E2E, private cache/ownership tests, responsive/a11y review at 320/390/768/1440, security gates and explicit deployment approval | Open; no deployment or merge |

Dependency and secret scans detect known patterns/advisories at the time of their
execution; they do not establish a complete security audit. Gitleaks must not be
silenced globally for synthetic fixtures: investigate each finding and, if needed,
document a narrowly scoped exception. A network error or unavailable scanner is a
failed/unverified check, not a pass. Secret scanning of committed history cannot
prevent someone adding a secret under a future public variable without review.

## SEC-PR01-01 — authorized temporary acceptance

The user authorized the original acceptance from `cc57d05` in Draft PR #4 and
subsequently authorized continuity from `e30c006`. Owner: **KevinhosUTP**. Policy
schema 2 retains PR #4/original branch as provenance, not a restriction on PR number.
The machine-readable policy is `.github/security/sec-pr01-01.json`.

Acceptance applies only in `KevinhosUTP/n8n-qa-selfhosted` through
`.github/workflows/frontend-checks.yml`, with exact `GITHUB_WORKFLOW_REF`:

| Context | Acceptance |
| --- | --- |
| `push` to `develop` | Eligible; workflow ref must end exactly `@refs/heads/develop`; payload ref/SHA must match checkout/event |
| Internal `pull_request` to `develop` | Eligible only when head and base repositories match the authorized repository, fork is false and head is not `main`; workflow ref must end `@refs/pull/<number>/merge`, consistent with event/PR refs |
| `main` push or PR targeting `main`, PR originating from `main`, fork PR | Strict scanning only; never a temporary exception |
| Other branches' pushes, tags, deployment/manual/scheduled/target/reusable events or different workflow/repository | No acceptance; unknown/inconsistent execution identities fail closed |

Working branches are checked through their PR; push triggers now cover only
`develop` and `main`. PR triggers still cover both targets. All workflow jobs,
steps, Linux requirements, pinned actions, permissions, secret scan and timeouts
remain unchanged. On main, exposure and artifact inspection execute without
granting acceptance; the full audit intentionally fails while the vulnerable
findings remain. A strict clean audit needs no exception and claims no correction.
Local execution remains diagnostic only on the original branch; it cannot certify
Linux or grant CI acceptance. This scope never authorizes merge or deployment.

| Risk dimension | Assessment and required evidence |
| --- | --- |
| Vulnerability | GHSA-vfj7-8cjw-p6xm / CVE-2026-93687, recursive brace expansion/compilation can exhaust the stack |
| Published severity | High; npm CVSS 3.1 7.5; GitHub advisory CVSS 4.0 8.7. This is the advisory severity, not a demonstrated Internet attack against KevoLint |
| Affected chain | `@next/eslint-plugin-next@16.4.2 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`; four npm nodes propagate one approved advisory |
| Execution environment | Development/CI lint tooling; every installed chain package must be classified exclusively `dev` in the unchanged lockfile |
| Untrusted input | Next's plugin invokes glob expansion when ESLint `settings.next.rootDir` is configured. Current effective configs omit it; public HTTP/workflow data has no demonstrated route to this development tool |
| Applicable exploitability | A bounded prior local probe reproduced `RangeError` on deeply nested patterns; no current remote request path demonstrated. Contributor-controlled lint config remains an input requiring review |
| Impact | Availability of the lint/CI process; future runtime inclusion or exposure would invalidate this assessment |
| Production exclusion | Physical standalone, prepared published assets and all required NFT traces must pass inspection, including nested packages, imports, original-source hashes, distinctive code signatures and symlinks. `npm audit --omit=dev` alone is insufficient. Local Windows evidence never certifies Linux |
| Mitigations | Exact manifest/resolved dev chain/lock hash; prohibit `next.rootDir`; keep all lint rules; fail closed on any unexpected audit/process result; require successful Linux foundation and artifact evidence from the same Git revision |
| Residual risk | The vulnerable development dependency is still installed. A malicious/future configuration or newly discovered input route could cause denial of service. Scanner signatures are bounded detection for the approved sources, not proof against arbitrary transformed/obfuscated code |

Validity ends **2026-10-31 23:59:00 America/Lima**, exactly
**2026-11-01 04:59:00 UTC**. At that instant and afterward every acceptance-eligible
execution fails, including an otherwise clean audit. Strict main/fork inspection
continues without an exception; vulnerable audit results still fail there.
No CLI/environment clock override, automatic
renewal or scheduler is provided. Previously successful checks do not change by
themselves: rerun all checks when making a later decision.

Owner reviews are required on **2026-10-24** and **2026-10-31**, and whenever
dependencies change. Review the official advisory, braces/micromatch releases and
the official Next plugin dependency graph for a compatible correction. Registry
investigation on 2026-10-17 found no patched braces release; the official Next
stable/canary retained the chain. npm proposed a major downgrade to plugin 14.2.35,
not an approved compatible fix. No overrides, forks or external patches are used.
If an official compatible correction appears, suspend this acceptance and submit
the minimal update for approval. No automatic renewal or dependency update is authorized.

Revoke acceptance on expiry, any additional/different advisory or increased severity,
unexpected node/edge/version/dev classification/manifest/hash/context, changed fix
availability, `rootDir` presence, affected production code, incomplete inspection,
scanner/network/timeout error, or unsuccessful/missing Linux foundation evidence.
The lock hash is `aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5`.
Full raw audit output remains visible, including all severities; the evaluator has
no general ignore list. An unexpected finding fails the check rather than being
hidden. Secret scanning remains independent and enabled.

Future internal PRs may pass with the exact approved dependencies and all Linux
evidence. A dependency/lockfile change, new advisory or exposure anomaly revokes
acceptance for that execution; it does not rewrite the policy or historical checks.
Changes to the policy/controller/workflow require explicit review. Repository
contributors can edit those files, so the checks are not a trust boundary against
a contributor who also replaces the controls. No branch-protection changes are made.

Affected executable code is **never permitted** in a production artifact by this
acceptance. Before any future Coolify deployment preparation, obtain authorization
and rerun the complete Linux artifact verification on the candidate revision and
artifact. This work changes no services, infrastructure, dependencies or lint rules.

Official references: [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[Next ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint),
[Next output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
