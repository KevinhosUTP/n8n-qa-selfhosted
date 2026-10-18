# PR03 · Public layout and responsive navigation

Authorized base: `06e9fc958d27dd1e7d227710566871ad2c79a0fa` (`develop`).
Branch: `codex/kevolint-pr03-public-layout`. Delivery remains Draft; no merge or deployment.

## Implementation and traceability

- Public route-group layout composes PublicHeader, the existing technical page and Footer. No landing, informational page or auth form is implemented.
- PublicContainer reuses PR02's generated gutter and 1200px maximum. Header is 68px below 1024 and 80px from 1024. Compact header/footer keep their own 20px outer inset; content uses 16/20/32px at the 320/390/768 samples. Native Windows scrollbars reduce the available layout viewport; browser reports record both dimensions and assert gutters against actual available width, rather than hiding scrollbars.
- Desktop header distributes the six original item widths across the content container. Footer preserves original link widths and uses 420/228px reference minimum heights, expanding for content. No sticky behavior or new shadow scale.
- Header/footer use original Horizontal 194px; narrow drawer uses original Wordmark 144px. Original 24 SVG bytes and the 61-token source remain unchanged. BrandLogo adds an optional native loading attribute, default lazy; the small drawer logo/menu load eagerly so first opening does not depend on a hidden lazy image.
- PublicNavLink renders an anchor, exact aria-current matching and disabled prefetch for pending URLs. It shares Button's existing visual classes. Button keeps its native semantics and adds React 19 native ref support. No general polymorphic control/library.
- ModalSurface is an internal native dialog boundary with minimal dismissal/focus/scroll mechanics, available for PR05 to reuse. It does not implement the future Dialog/Drawer catalog. No storage, authentication, network data or session state is introduced.
- The root focus boundary handles public route changes. The real 404 also focuses its main after mount, covering full document reloads to missing public URLs.

| Design reference | Figma nodes |
| --- | --- |
| Header set and D/M variants | 4:173; 4:125; 4:159 |
| Compact header instances checked directly | 126:11441; 133:22215 |
| Footer set and D/M variants | 4:352; 4:286; 4:319 |
| Public compositions 1440/768/390/320 | 19:2; 133:22214; 19:99; 126:11440 |
| Mixed drawer 768/390/320 | 145:14747; 19:1871; 132:14145 |
| Original functional menu icon | 3:30; export integrity in design-system/public-layout.json |

## Visual comparison and explicit adaptations

The reference is the approved Figma design, inspected through component contexts and screenshots. The drawer references contain private and public destinations: this authorized adaptation retains the 360/336/272px panel, Wordmark, scrim, border, close treatment and spacing while exposing public links only. The public signup CTA reuses the approved primary Button; no dashboard, plan or account actions are copied.

Inter remains the exact local PR02 4.1 binary and license. PR02's comparison (Label 500, 14/20, measured 65.65625px for the Figma 66px reference) remains applicable; no font substitution. No claim of Figma font binary identity or automated pixel-perfect equivalence.

The secondary control border deliberately retains PR02's accessible control-border rather than reverting to the decorative border in the original header master. Footer preserves approved prototype copy and the secondary signature as text, without substituting a font for W3. The central technical content is intentionally not the landing reference.

Sixteen real Windows Chrome captures are versioned in `pr03-evidence/`: four full public layout samples, four header captures, four footer captures, three drawer samples and one keyboard-focus sample. Component captures use the browser's DOM bounding boxes, not image editing. Next development tooling is excluded from captures; application content and native scrollbars are preserved. Local captures were made on the working PR03 tree based on the base SHA, before its first commit; Linux CI reruns the browser suite against its checked-out revision.

## Navigation availability

| URL | Current response | Responsibility |
| --- | --- | --- |
| / | 200, technical page | PR03 shell; landing remains PR04 |
| /como-funciona, /seguridad, /precios, /ayuda | 404 | PR04 |
| /legal/terminos, /legal/privacidad, /legal/cookies | 404 | PR04; final legal publication requires review |
| /sign-in, /sign-up | 404 | PR06; no provider integration here |

These are genuine links and genuine missing responses. Unit tests verify catalog and placement; browser and standalone HTTP smoke verify current status. A controlled fixture exercises same-route selection and lifecycle without creating fake product pages. **Essential destinations remain unimplemented: this public navigation is not ready for a commercial deployment.**

## Verification

- Clean `npm ci --no-audit --no-fund`; no dependency or lockfile change.
- Vitest: **276 passing tests**, including 255 previous tests and 21 new catalog/semantics/integrity/production-fixture cases.
- PR03 real Chrome: seven widths 320/390/767/768/1023/1024/1440, short viewport, native keyboard and pointer, Escape, forward/reverse focus cycle, inert background focus exclusion, visible focus, close/scrim, viewport transition and reduced motion.
- Ten rendered contrast observations cover primary/tertiary navigation and secondary close control in default/hover/pressed plus keyboard focus. Lowest observed text contrast is 7.42:1; close focus contrast is 6.83:1. Pressed paint probes suppress only their own activation; independent interaction tests execute real actions.
- Actual navigation to /precios reaches the real 404 and focuses its content; history back/forward and Ctrl+click new-tab behavior are checked. The fixture verifies same-route close, exact prior scroll styles/position restored on unmount, and successful remount/reopening.
- Original PR02 browser suite: 14 route/viewport samples and 32 state observations; ISSUE-HC-01 remains isolated and passes 19.68:1 in its enabled QA states. Light/High Contrast complete themes remain disabled.
- Python: compileall, **15 regression tests** and Streamlit initial-screen smoke pass using an ignored isolated environment with existing requirements. System Python initially lacked test dependencies; that failed setup attempt is not presented as a passing test. No backend/requirements changes.
- Lint, TypeScript, negative boundary/environment compiler tests, credential-free build and standalone smoke pass locally. Exposure, artifact and complete audit controls were executed and correctly **denied** the unauthorized local diagnostic branch; none is represented as a local security acceptance. Audit ran completely and reported only the four known high transitively related nodes. No context, branch or GitHub variables were simulated to bypass the denial. Definitive Linux audit/artifact evidence and final commit/run URLs are recorded in the Draft PR description after CI finishes; this document alone does not assert Linux acceptance.

Production prebuild rejects either PR02 or PR03 temporary route. Smoke verifies those routes return 404, along with private/business endpoints. Fixtures are removed after the browser process ends, including generated dev route types. No runtime switch can publish them.

## Security and remaining limits

SEC-PR01-01 remains **temporarily accepted, not fixed**, owner `KevinhosUTP`. Original deadline: **31 October 2026, 23:59 America/Lima**, `2026-11-01T04:59:00Z`; no renewal. Exact chain, advisory, lock hash, context restrictions, additional-finding rejection, Linux artifact coupling and expiry behavior are unchanged. Local PR03 dependency acceptance must fail outside the authorized GitHub PR context; no GitHub variables are simulated.

No dependency entries, lockfile, security policy/script, Python workflow, backend, main, historic PR #3, infrastructure or providers are changed. Frontend workflow adds the public browser check and retains all existing jobs/steps, Linux, timeout and secret controls.

Not verified: screen readers, manual browser-menu zoom, physical mobile devices, Safari/Firefox, exhaustive OS/browser combinations or integral WCAG conformance. Existing CSS 200% reflow verification is not manual native zoom. Modal behavior is verified in installed Chrome and must not be generalized to untested platforms.

No deployment or commercial readiness is asserted. PR04/PR05 remain unstarted; no merge is authorized by this delivery.

## Changed-file inventory

- `.github/workflows/frontend-checks.yml`
- `apps/web/.gitattributes`
- `apps/web/README.md`
- `apps/web/design-system/public-layout.json`
- `apps/web/docs/pr03-evidence/evidence.json`
- `apps/web/docs/pr03-evidence/public-drawer-320.png`
- `apps/web/docs/pr03-evidence/public-drawer-390.png`
- `apps/web/docs/pr03-evidence/public-drawer-768.png`
- `apps/web/docs/pr03-evidence/public-drawer-keyboard-focus.png`
- `apps/web/docs/pr03-evidence/public-footer-1440.png`
- `apps/web/docs/pr03-evidence/public-footer-320.png`
- `apps/web/docs/pr03-evidence/public-footer-390.png`
- `apps/web/docs/pr03-evidence/public-footer-768.png`
- `apps/web/docs/pr03-evidence/public-header-1440.png`
- `apps/web/docs/pr03-evidence/public-header-320.png`
- `apps/web/docs/pr03-evidence/public-header-390.png`
- `apps/web/docs/pr03-evidence/public-header-768.png`
- `apps/web/docs/pr03-evidence/public-layout-1440.png`
- `apps/web/docs/pr03-evidence/public-layout-320.png`
- `apps/web/docs/pr03-evidence/public-layout-390.png`
- `apps/web/docs/pr03-evidence/public-layout-768.png`
- `apps/web/docs/verification-pr03.md`
- `apps/web/package.json`
- `apps/web/public/navigation/menu.svg`
- `apps/web/scripts/check-design-build.mjs`
- `apps/web/scripts/check-public-browser.mjs`
- `apps/web/scripts/public-preview.mjs`
- `apps/web/scripts/smoke-http.mjs`
- `apps/web/scripts/verify-public-navigation.mjs`
- `apps/web/src/app/(public)/layout.tsx`
- `apps/web/src/app/(public)/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/components/brand/BrandLogo.tsx`
- `apps/web/src/components/public/Footer.tsx`
- `apps/web/src/components/public/PublicContainer.tsx`
- `apps/web/src/components/public/PublicHeader.tsx`
- `apps/web/src/components/public/PublicNavLink.tsx`
- `apps/web/src/components/public/PublicNavigation.tsx`
- `apps/web/src/components/public/RouteFocus.tsx`
- `apps/web/src/components/public/internal/ModalSurface.tsx`
- `apps/web/src/components/public/public-layout.module.css`
- `apps/web/src/components/public/public-navigation.module.css`
- `apps/web/src/components/ui/Button.tsx`
- `apps/web/src/components/ui/button-classes.ts`
- `apps/web/src/lib/navigation/public-routes.ts`
- `apps/web/tests/design-build.test.mjs`
- `apps/web/tests/fixtures/public-layout-preview.tsx`
- `apps/web/tests/public-navigation.test.ts`
