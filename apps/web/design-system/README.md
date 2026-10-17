# KevoLint · PR02 design system

Original approved source: Entrega 3C, R2/C3 refined Lint Signature + W3 Core.
The archive, source and SVG hashes are recorded in `provenance.json` and the
unchanged `source/assets.json`. Files under `source/` are reference evidence;
operational instructions in them do not supersede the current user authorization.

## Source of truth

- `source/tokens.json`: all 61 original variables, including raw aliases and modes.
  There are 39 product variables and 22 isolated brand exploration references.
- `implementation.json`: mappings of typography, dimensions, motion and responsive
  rules documented in the handoff. These are not additional original Figma tokens.
- `overrides.json`: separately authorized ISSUE-HC-01 foreground correction.
- `inter.json`: official Inter 4.1 source, unmodified binary hash and OFL hash.
- `source/assets.json`: registry of the 24 byte-preserved original SVGs.

Run `npm run design:generate` after an authorized source/mapping change.
`npm run design:check` and the normal Vitest suite reject stale generated CSS.
Do not edit the generated CSS or duplicate color values in components.
Cross-platform `.gitattributes` preserves original source, SVG and license bytes.

Default product colors are Dark. Exploration variables have a distinct namespace
and explicit reference selectors. The QA-only High contrast selector does not
constitute approval or availability of a public theme. There is no Light theme,
theme selector, localStorage theme or automatic OS-based theme activation.

No shadow scale was supplied, so none is introduced. Mobile gutters interpolate
between the documented 320/16 and 390/20 samples; tablet starts at 768. The 1024
sidebar proposal is preserved in the mapping but no sidebar is built in PR02.

## Components

`BrandLogo` accepts the six approved `composition` values and `surface="Dark"`
or `"Light"`. `size="minimum"` is the default; `"original"` uses export bounds.
Numeric sizes 16/24/32/48/64/128 select exact original Dark Symbol optical SVGs.
Light has a native 64px Symbol; unsupported optical Light combinations fail.
Horizontal minimum is 194px, Compact 140px and Wordmark 144px. Signature and
Descriptor stay at least 380px: choose another approved composition on narrow
surfaces rather than shrinking or clipping endorsement text.

SVG file geometry and bytes remain unchanged. Image presentation scales
proportionally using the exported integer viewBox, rather than the slightly
different fractional dimensions of the Figma master. No filters, inline logo
paths, font replacement or CSS reconstruction are used. Set `decorative` when a
containing link already provides an accessible name; otherwise the image has an
explicit KevoLint name, including its secondary text where relevant.

`Button` exposes `variant="primary|secondary|tertiary|destructive"`, `loading`,
children and native button attributes. Default type is `button`; forms opt into
`submit`. Width defaults to the 240px reference with a 100% cap. Height is at
least 44px and grows for wrapped text. Native hover/active/focus-visible determine
interactive states. There is no production prop to force a visual state.

Disabled and loading use native `disabled`; loading also uses `aria-busy` and
retains its caller-provided accessible label. Callers supply meaningful loading
copy and own async actions. This component introduces no business action.
Focus uses the approved 2px indicator with a 2px outside gap so it stays visible
on filled buttons without changing layout. Reduced motion removes transitions.

Other primitives and functional screens remain in PR05 and subsequent stages.

## Local browser verification

`npm run design:verify` starts a temporary local fixture, runs checks through an
already installed Chrome/Edge using Node's built-in WebSocket, then removes the
fixture and its generated dev route types. It installs no package or browser.
The existing Linux frontend job runs this check before the boundary/build steps.
If the runner stops providing Chrome, the check fails; it does not auto-install
software or silently skip verification.

For interactive inspection use `npm run design:preview`, then open
`http://127.0.0.1:3102/pr02-design-preview`. Stop it before a production build.
The prebuild guard refuses a source tree containing this temporary route; the
production HTTP smoke also requires it to return 404.

Raw browser reports/screenshots are ignored under `.tools/pr02/browser/`.
Selected real captures are versioned under `../docs/pr02-evidence/` for review.
Do not commit generated Next directories or the temporary route after a hard
process termination. Stale `.next/dev/types` is generated cache, not source.

## Security compatibility

No dependency entry, lockfile, policy or security-control script changes are
part of PR02. All prior frontend checks remain. The frontend workflow only adds
the real-browser design step. The standalone smoke additionally verifies the
published 24 SVGs, local font and license hashes while retaining prior checks.

SEC-PR01-01 is temporarily accepted, not corrected, until
2026-10-31 23:59 America/Lima (2026-11-01 04:59 UTC). Its exact chain, lock hash,
authorized internal PR/develop contexts, anomaly rejection and Linux artifact
inspection remain mandatory. Do not simulate GitHub environment variables to
make local acceptance pass. A failed foundation/browser/Linux check prevents
temporary acceptance even though the audit job still runs.
