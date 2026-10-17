# Security and implementation gates after PR01

No item below is satisfied by the development placeholder or a successful build.
No backend, provider, DNS, deployment or production change is authorized by this file.

| Gate | Required evidence / future stage | Current state |
| --- | --- | --- |
| SEC-PR01-01 / merge blocker | Resolve GHSA-vfj7-8cjw-p6xm (`braces <=3.0.3`) through the official Next ESLint plugin → fast-glob → micromatch dependency chain, then rerun the full audit | Open: four high dependency findings; no upstream braces patch published on 2026-10-17; no audit waiver or forced downgrade |
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
