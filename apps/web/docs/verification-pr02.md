# PR02 · Design System & Brand Assets · Verification

Base: `develop` at `d165fc4ee4f3f074de3f41b72654a59040aac941`.
Branch: `codex/kevolint-pr02-design-system`. Review state: Draft, no merge or deployment.

## Implemented and traceable

The Entrega 3C ZIP was read and all 56 SHA-256 entries verified. Archive hash:
`6b5270ed7db44693650f79b64ed2f26d7cad31f0cfc62192974cc904378716aa`.
Nine original reference files and all 24 SVGs are byte-preserved. Original token,
asset, component, font, contrast and source-register manifests remain unchanged.
The generator maps all 61 tokens (39 product + 22 exploration references), validates
raw/resolved aliases, separates modes/namespaces and verifies reproducible CSS.
Typography/layout rules and ISSUE-HC-01 are recorded separately from original variables.

BrandLogo covers six compositions × Dark/Light and the supplied Dark optical sizes.
W3 remains the original vector. Inter 4.1 is self-hosted with unmodified bytes,
source URLs, release/archive/font hashes and its original OFL license.
Button is the only general UI primitive advanced from PR05.

The public page remains technical, Spanish, noindex and without business endpoints.
Light and complete High Contrast product themes are not enabled. The temporary
visual fixture is refused by prebuild and must return 404 in the standalone smoke.

## Automated local results — 2026-10-17, Windows

| Check | Observed result |
| --- | --- |
| Clean `npm ci --no-audit --no-fund` | Passed; existing lockfile/dependency versions retained |
| Lint | Passed |
| Design generation/check | Passed |
| Vitest | 255 passed in 8 files: existing 169 plus 86 PR02 cases |
| TypeScript / Next route types | Passed after removal of stale temporary dev route cache |
| Negative client/server compiler and public configuration | Both passed |
| Credential-free production build | Passed outside the Windows sandbox; only `/` and `/_not-found` generated |
| Standalone HTTP smoke for PR02 | Passed: 24 exact SVGs, official local font/license hashes, headers, canary protection and preview/business routes absent |
| Complete browser orchestration | Passed, including Windows owned-process cleanup and temporary route/dev-types removal |
| Python compileall | Passed |
| Python unittest | 15 passed |
| Streamlit initial-screen smoke | Passed |

Three existing junction tests initially failed under Windows sandbox permissions;
the complete Vitest suite subsequently passed outside that restriction. The API
regressions also passed outside the sandbox. Existing Starlette/httpx deprecation
and Streamlit bare-mode warnings did not require dependency or backend changes.

An initial sandbox build hit EPERM when creating a generated prerender directory;
the build and smoke passed when repeated with the necessary filesystem permissions.
An audit/exposure attempt initially could not execute because the automatic approval
service hit a usage limit. After execution became available, the full local audit
ran and the controls correctly denied temporary acceptance on the PR02 local branch
(`Unauthorized local diagnostic branch`, exit 1). Exposure was likewise denied.
No GitHub context was simulated. Positive acceptance remains exclusively dependent
on the authorized GitHub CI context, rather than treating local denial as success.

Negative design cases include missing/duplicate/invalid tokens, unresolved or
cyclic aliases, inconsistent raw values, widened HC correction, altered SVG bytes,
viewBox changes, active SVG content, missing SVG/license, extra SVG, changed source
manifest, unknown brand/optical variants, unsupported button variant and accidental
inclusion of the temporary preview route in production.

## Real browser evidence

Chrome `155.0.8059.84` on Windows executed real native events through its browser
protocol, using existing browser software and no additional npm dependencies.
The complete browser run passed before the final source commit; selected captures
come from that implementation working tree. The Linux workflow repeats the browser
checks against its checked-out revision and records results in its job summary.
Local evidence does not certify the Linux artifact.

The first Linux run passed real-browser checks, production build, standalone
smoke and artifact inspection. Its secret job flagged the public tokens-manifest
SHA-256 in the implementation provenance object as a generic API key. The
provenance mapping was changed to explicit filename/sha256 records without changing
the hashes or original files; no scanner exclusion or allowlist was introduced.
Only the newly created PR02 commit is rewritten to remove that false positive
from its scanned history. The final head must pass the full scanner again.

| Verification | Observed result |
| --- | --- |
| 320, 390, 768, 1440 px | Technical page and fixture checked; no page-level horizontal overflow |
| 767/768 and 1023/1024 px | Both sides checked; no overflow |
| Brand | 12 original composition/surface variants plus minimum examples loaded and proportional |
| Button | Default, native hover/pressed, disabled, loading, keyboard focus checked |
| Keyboard | Tab/Shift+Tab order; disabled/loading skipped; Enter and Space activate once |
| Disabled/loading activation | Actual pointer activation blocked |
| Motion | Reduced-motion preference tested before fixture navigation; transitions become 0s |
| Reflow | CSS zoom 200% checked; not a manual browser-menu zoom test |
| Network | Observed page HTTP resources are same-origin, including the local font |

The originals comparison panel scrolls internally on narrow screens to preserve
380px signatures; the technical product page and buttons reflow without cropping.
The Next development indicator visible in captures is development tooling and is
not part of the product design or production build.

### Inter comparison

Live Figma references: [Button 3:194](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-194),
[Label 3:74](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-74),
[BrandLogo 393:752](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-752).

All ten typography roles use the documented weights, sizes, line heights and
tracking. The browser font engine identified `Inter Variable`, PostScript
`InterVariable-Text-Medium`, as a custom font for the Label's nine glyphs, rather
than a fallback. At Inter 500 / 14px / 20px, "Continuar" measured 65.65625px;
the Figma text frame is 66×20px. The 0.34375px difference compares rendered text
with a frame, so it is not proof of a different font or pixel-identical metrics.
The captures were visually inspected against Figma; no significant mismatch was
observed for the selected Button label and supplied typography references.

Figma and the ZIP do not identify the original font binary/version. Exact binary
equivalence and exhaustive pixel-by-pixel typography equivalence are therefore
unproven; there was no silent replacement of the specified family or W3 wordmark.
Official distribution: [Inter 4.1](https://github.com/rsms/inter/releases/tag/v4.1).

### ISSUE-HC-01

Original critical text `#FF8F9A` on white remains recorded in the source: 2.18:1.
The authorized override uses existing `color/background` `#0A0B0E` as the isolated
destructive foreground. Effective browser colors were dark text on white and
19.6792:1 in default, hover, pressed, keyboard focus and loading. Disabled retains
the original disabled surface/text behavior. This does not change global critical
colors or certify the entire High Contrast mode. Focus uses a 2px violet outline
and outside gap; keyboard and blocked activation were tested independently.

Normal text threshold: 4.5:1; large text 3:1; required control/focus visual contrast
3:1. Disabled controls are distinguished from active contrast assertions. A 44px
minimum is the project target, not a claim that WCAG AA always mandates 44px.

Not executed: screen-reader testing, manual browser-menu zoom, exhaustive
cross-browser/OS raster comparisons, integral HC theme validation or full WCAG
certification. The automated checks do not claim those results.

## GitHub acceptance gate

Frontend checks retain foundation, full audit, exposure, Linux artifact inspection,
secret scanning, read-only permissions, 15-minute job limits and same-revision
binding. The added design browser step uses the runner's preinstalled Chrome;
if it cannot complete, foundation fails and no temporary security acceptance applies.
The Python workflow is unchanged. No new GitHub Action or npm dependency is added.

CI results must be checked on the final PR head; the Draft PR description is the
delivery record for the exact run URLs and SHA. This document's local pending
rows must not be read as successful Linux validation.

SEC-PR01-01 remains temporarily accepted, **not corrected**, until
2026-10-31 23:59 America/Lima / 2026-11-01 04:59 UTC. Its policy, scripts, exact
chain and authorized lockfile hash are unchanged. No GitHub context is simulated.
New findings, unexpected versions/hash/context, expiry or failed Linux evidence
still revoke acceptance. No main, fork, production or deployment exception is added.

## Selected unmodified browser captures

- [Technical page, 320px](pr02-evidence/technical-320.png)
- [Technical page, 390px](pr02-evidence/technical-390.png)
- [Technical page, 768px](pr02-evidence/technical-768.png)
- [Technical page, 1440px](pr02-evidence/technical-1440.png)
- [Component fixture, 320px](pr02-evidence/components-320.png)
- [Component fixture, 390px](pr02-evidence/components-390.png)
- [Component fixture, 768px](pr02-evidence/components-768.png)
- [Component fixture, 1440px](pr02-evidence/components-1440.png)
- [All approved brand compositions and typography](pr02-evidence/components-and-original-brand-1440.png)
- [HC destructive keyboard focus](pr02-evidence/hc-destructive-keyboard-focus.png)
- [HC destructive native pressed state](pr02-evidence/hc-destructive-pressed.png)

Review the immutable source/manifests, component contracts and reproducible commands
in `../design-system/README.md`. PR02 does not implement the landing, dashboard,
provider integrations, backend changes or deployment preparation.
