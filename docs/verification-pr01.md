# PR01 verification evidence

Date: 2026-10-17 (America/Lima). Foundation base: `develop` at
`967efe63bb6e0581f75972e44fd891840be053b6`. SEC-PR01-01 implementation starts from
`cc57d05b48194b8ab1bff2c2041fb8db0b3843bc` on `codex/kevolint-pr01-foundation`,
inside [Draft PR #4](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/4).
Scope: temporary acceptance of a vulnerable development dependency; no correction,
integration certification, merge or deployment.

## Local execution

Windows, Node 22.20.0, npm 10.9.3, TypeScript 5.9.3, Next 16.4.2,
React/React DOM 19.3.1, ESLint 10.13.0, Vitest 5.0.5. Python 3.12.14 in the
existing ignored `.venv`; dependencies and the lockfile are unchanged.

| Check | Executed result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS: clean installation from the approved lockfile |
| `npm run lint` | PASS: zero errors/warnings; existing configuration unchanged |
| `npm test` | PASS: 103 tests (26 existing configuration tests plus 77 security cases) |
| `npm run test:boundary` | PASS: actual Next compiler rejects client import of server-only module; rejects unreviewed public environment without echoing its value |
| `npm run typecheck` | PASS: route type generation and strict TypeScript |
| `npm run security:exposure` | PASS: exact installed development chain and effective lint configs; no `settings.next.rootDir`; existing recommended Next/Hooks/TypeScript rules enabled |
| `npm run build` | PASS: credential-free standalone production build; `/` and framework not-found only |
| `npm run smoke` | PASS: actual standalone HTTP server, root 200; unknown path, `/app`, `/api/audits` 404; POST audit endpoint absent; static scripts, headers and synthetic canary checks |
| `npm run security:artifact` | PASS locally on the prepared physical artifact; `linuxVerified: false`. Linux evidence remains mandatory below. Missing prepared assets fail |
| `npm run security:dependencies` | Raw full audit exits **1**, four high nodes sharing the approved advisory. Evaluator accepts only the exact temporary scope and prints owner/expiry. Local output is not technical Linux acceptance |
| Existing Python compile / unittest / Streamlit | PASS: compileall, all 15 existing unittest tests and initial-screen AppTest |
| Gitleaks | PASS: official 8.30.1 over 29 locally available commits through `8d852c6`, and full remote fetched history; no global suppression added |

Negative fixtures cover expiry at the exact instant and afterward; additional or
different advisories, extra via roots/cycles, increased severity, inconsistent or
missing counters, invalid/truncated/incomplete JSON, process errors, actual bounded
subprocess timeout, network error and exit/report mismatch. They reject unexpected
version/path/dev/manifest/hash/extra lock copies, unauthorized repository/PR/fork/
branch/event/OS/revision, unsuccessful foundation or mismatched artifact evidence,
`rootDir` presence and disabled required rule families.

Temporary artifact tests reject nested affected packages, renamed manifests,
original-source hashes, vulnerable static signatures, imports, external/development/
broken/cyclic links, missing/empty directories, missing or incomplete server/route
NFT traces and traced dev dependencies. Safe internal links are fully traversed;
comments and copied devDependency declarations do not imply executable inclusion.
A synthetic clean audit is labelled `sin hallazgos`, without claiming a fix.
Next's trace includes unrelated `semver/package.json` metadata, explicitly recorded
without classifying it as executable dev code; affected package metadata is always
rejected. An unrelated dev implementation in a trace is also rejected.

Local prepared build: BUILD_ID `vSJIi52FMLnqoSArkKhpx`; 1,481 inventory entries,
five required NFT traces; inventory SHA-256
`1e7f3faad75824c740d0e31a3f23498a06ce0325a376abf11aba0312002e8b15`.
No affected physical package/import/source/signature or unsafe link was detected.
This inventory belongs to the local working tree and does not attest Linux.

The sandbox blocked Windows test junctions (`EPERM`); the authorized outside-sandbox
run passed all link tests. Historical Next directory/Python TestClient restrictions
were likewise resolved by authorized reruns. Existing Starlette/httpx deprecation
and Streamlit bare-mode warnings do not change the passing regressions.

## Reproduction and evidence binding

Inside `apps/web`, using the declared Node/npm versions:

```sh
npm ci --no-audit --no-fund
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

Boundary tests precede the normal build. Smoke prepares static/public assets before
inspection. No credentials or `.env.local` are required. Runtime smoke starts with
an allowlisted OS environment and contacts no providers. Physical artifact traversal
does not mistake checkout ancestor dependency resolution for packaged code. It
checks symlinks, packages, imports, original-source hashes, distinctive vulnerable
signatures and required NFT traces. Generated and published assets must match;
missing/unreadable evidence fails closed.

Ignored `.tools/security/{exposure,artifact,dependencies}.json` reports record time,
Git revision, OS/release/architecture, Node version, lock hash, BUILD_ID, inventory
with file hashes, trace hashes, process outcomes and evaluation results. The full
structured reports appear in logs and GitHub step summaries. Dependency reports
preserve raw audit output, including every severity and stderr.

Linux foundation outputs its revision/inventory digest only after build, preparation,
smoke and artifact inspection pass. Dependencies runs with `always()` after
foundation; it executes the full audit even when foundation failed or acceptance
expired. Risk acceptance requires foundation success plus identical artifact/audit
Git revision and inventory digest. Both jobs validate event scope. PR runs record
the evaluated merge-test SHA and source head SHA. Each frontend job has a 15-minute
limit; npm audit has a 120-second limit. Windows output never attests Linux.

The audit dependency inventory total must match the unchanged lockfile. SHA-256:
`aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5`.
Exact approved chain: plugin 16.4.2 → fast-glob 3.3.1 → micromatch 4.0.8 →
braces 3.0.3, exclusively dev. Manifest dependencies match the lockfile; only npm
scripts change. No overrides, forced versions, patches or packages are introduced.

## Published CI and acceptance gate

Before these controls, [frontend run 39025112024](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025112024)
on `cc57d05` passed foundation/secrets and failed the full audit; the
[Python run](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39025112000)
passed. Those historical runs do **not** verify the new Linux artifact control.

Security implementation commit `8d852c653f32bd89a41c0eabadbe9aeec13a436d`:

| Remote check | Result and evidence |
| --- | --- |
| Linux foundation | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39038726823/job/117413703503): clean install, lint, all 103 tests, compiler boundary, typecheck, effective exposure, credential-free build, prepared smoke and physical artifact inspection |
| Full dependency control | [PASS with explicit temporary acceptance](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39038726823/job/117413872450): npm exits 1 with exactly four high nodes, one approved root; no finding hidden |
| Secrets | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39038726823/job/117413703631): full-history official Gitleaks |
| Unchanged Python workflow | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39038726789/job/117413703356): compilation, 15 unittest regressions, Streamlit smoke |
| Authorized branch push context | [PASS](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39038724471): independent foundation, secrets and full audit on the source SHA |

The PR event checked merge-test revision `144f7d2031380c85c50e52f9267e00c27b68fdad`
and recorded source head `8d852c6`. Linux artifact BUILD_ID:
`6rsd638b1drz3gUXZmh0A`; 1,251 inventory entries; five required traces; inventory
SHA-256 `8baa3f13c3c0862beaa42053c7dd989c7e96098a9ab9bffb9bda6a6fa2526393`.
`linuxVerified: true`. The dependencies report confirms foundation `success`, this
same merge-test revision and this exact inventory digest, with the approved lock
hash. Affected packages/imports/source hashes/signatures and unsafe links were absent.
The unrelated traced semver manifest is explicitly recorded as metadata.

These links record the executed security implementation. This subsequent evidence
publication changes documentation only and reruns the checks; the latest PR checks
are authoritative for that publication and all future changes. Technical acceptance
always requires **all latest-commit GitHub checks to succeed**, including Linux
inspection and the unchanged Python workflow. Final delivery/PR description records
the latest publication results. Local build results or a production-only audit
cannot clear this gate. No merge or deployment is authorized by these passes.

## Authorization and residual risk

Owner: **KevinhosUTP**. Reviews: **2026-10-24** and **2026-10-31**. Expiry:
**2026-10-31 23:59:00 America/Lima = 2026-11-01 04:59:00 UTC**. Every execution
fails at/after expiry, without clock overrides, automatic renewal, scheduler or
retroactive changes to historical checks. New findings never inherit this exception.
Review official compatible corrections on those dates and after dependency changes;
availability requires owner review and an approved replacement. The policy, backlog
risk matrix and ADR define the exact authorized PR/branch and revocation conditions.

The vulnerable development dependency remains installed and could exhaust lint if
a new configuration/input route reaches it. Absent `rootDir` and verified production
exclusion constrain this risk; they do not cure it. Affected executable production
code is forbidden. Repeat complete Linux artifact verification before any future
authorized Coolify deployment preparation.

FastAPI, QA engine, Streamlit, Python tests/workflow, services, infrastructure,
DNS, dependencies, lockfile and lint rules remain unchanged. PR #3 is untouched;
no provider SDK, PR02, product UI, quotas, payments or real audits are introduced.
ISSUE-HC-01 and integration/privacy/edge gates remain open. Prior integrated-browser
localhost timeout leaves visual QA unverified; no new visual acceptance is claimed.
**PR #4 remains Draft; merge and deployment are not authorized.**
