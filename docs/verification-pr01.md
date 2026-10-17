# PR01 verification evidence

Date: 2026-10-17 (America/Lima). Scope: local foundation and CI proposal, not a
frontend integration/security certification or deployment. Base commit:
`967efe63bb6e0581f75972e44fd891840be053b6` on `develop`.

## Local execution

Windows, Node 22.20.0, npm 10.9.3, TypeScript 5.9.3, Next 16.4.2,
React/React DOM 19.3.1, ESLint 10.13.0, Vitest 5.0.5.
Python 3.12.14 in an isolated ignored `.venv`; existing requirements unchanged.

| Check | Executed result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS: clean installation from package-lock.json |
| `npm run lint` | PASS: zero errors/warnings |
| `npm test` | PASS: 26 configuration tests |
| `npm run test:boundary` | PASS: actual Next compiler rejects client import of server-only module; Next also rejects unreviewed public environment with generic error and no echoed synthetic value |
| `npm run typecheck` | PASS: route type generation and strict TypeScript |
| `npm run build` | PASS: production standalone output, only `/` and framework not-found; no provider credentials/files required |
| `npm run smoke` | PASS: actual standalone server, HTTP 200 `/`, HTTP 404 unknown path, `/app` and `/api/audits`; POST audit route absent; static scripts load locally |
| Header checks | PASS on all smoke GET responses: nosniff, referrer policy, permissions policy, noindex; no X-Powered-By or speculative CSP |
| Disclosure canary | PASS: synthetic server marker absent from returned HTML/scripts and generated browser/RSC artifacts |
| Existing Python compile check | PASS: `python -m compileall -q app.py apps packages tests scripts` |
| Existing Python tests | PASS: all 15 unittest tests |
| Existing Streamlit smoke | PASS: initial-screen AppTest |
| `npm audit --omit=dev --audit-level=low` | PASS at execution: zero production dependency vulnerabilities reported |
| `npm run security:dependencies` (full audit) | **FAIL / MERGE BLOCKER**: four high findings through development dependency chain to braces@3.0.3, GHSA-vfj7-8cjw-p6xm |
| Gitleaks 8.30.1 CLI | PASS: 27 local commits including source commit `1c40a53`; no leaks. Remote full-history job also passed |
| Integrated browser visual check | NOT VERIFIED: localhost navigation from the in-app browser timed out. HTTP smoke passed; no visual/a11y/browser-console result claimed |

The full dependency check is deliberately not waived or configured to succeed.
No patched braces release exists in the queried registry/advisory on this date;
the current Next canary also retains the affected dependency. No forced downgrade
to Next's ESLint plugin 14, ignore list or lower security threshold is applied.
See SEC-PR01-01 in the security backlog. A production-only audit does **not** clear
the full audit or make this draft ready to merge.

Initial sandbox execution blocked a Next generated directory (`EPERM`) and stalled
Python TestClient. Those attempts were not counted as passes; the authorized
outside-sandbox reruns produced the successful results above. Existing dependencies
emitted a Starlette/httpx deprecation and Streamlit bare-mode warning; tests passed
without changing backend code, requirements or tests.

The standalone smoke starts with an allowlisted OS environment, excluding provider
credentials and `.env.local`; no local environment files were created. The build
has no external font download, provider initialization or API request. No live
FastAPI, Clerk, Supabase, Sentry or Paddle call was made by this frontend.

## Published CI

[Draft PR #4](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/4) targets
`develop`. These completed remote results correspond to source commit
`1c40a53ea3e44c51bc23f2c9c492295e9b7346a4`; this evidence update changes documentation only.

| Remote job | Result and evidence |
| --- | --- |
| Foundation | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025009212/job/117374172892): clean npm install, lint, unit tests, negative compiler/config checks, generated types, production build and standalone HTTP smoke |
| Secrets | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025009212/job/117374172798): official Gitleaks CLI over fetched Git history |
| Dependencies | [FAIL](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025009212/job/117374172866): full audit; known unpatched development-tool advisory, no waiver |
| Existing Python workflow | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025009182): compilation, regression tests and Streamlit initial-screen smoke |

The original Python workflow remains byte-for-byte unchanged. The current checks
on the PR are authoritative for subsequent documentation commits or future changes.
PR01 remains a draft and does not satisfy the full acceptance gate until
SEC-PR01-01 is resolved. It has not been merged or deployed.

## Scope review

- Selective provenance from PR #3 is listed in ADR 0001; no merge/cherry-pick of that PR.
- FastAPI, QA engine, Streamlit, Python tests/workflow, workers and infrastructure: no diff.
- No provider SDKs, business routes, workflow fixture uploads, production credentials,
  brand asset modifications, DNS changes, deployment or merge.
- Minimal React pages reviewed for semantic main/headings/link and Spanish language;
  full responsive/accessibility/visual acceptance remains in later handoff stages.
