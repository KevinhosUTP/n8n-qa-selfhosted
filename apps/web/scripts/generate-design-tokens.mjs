import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));

export function variableName(token) {
  return `--kl-${token.status === "brand_exploration_reference" ? "reference-" : ""}${token.figmaName.replaceAll("/", "-").toLowerCase()}`;
}

function rawMode(token, mode) {
  if (mode === "Dark") return token.status === "brand_exploration_reference" ? "317:1" : "2:1";
  if (mode === "High contrast") return "38:0";
  if (mode === "Light") return "317:2";
  if (mode === "Mode 1") return "317:0";
  return token.collectionId === "VariableCollectionId:2:9" ? "2:2" : "2:0";
}

function selectedMode(token, mode) {
  if (Object.hasOwn(token.values, mode)) return mode;
  assert.equal(Object.keys(token.values).length, 1, `Missing mode: ${token.figmaId}/${mode}`);
  return Object.keys(token.values)[0];
}

export function validateTokens(manifest) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.tokens?.length, 61, "Expected 61 handoff tokens");
  const tokens = manifest.tokens;
  assert.equal(tokens.filter((t) => t.status === "approved_product").length, 39);
  assert.equal(tokens.filter((t) => t.status === "brand_exploration_reference").length, 22);
  const byId = new Map(tokens.map((t) => [t.figmaId, t]));
  assert.equal(byId.size, tokens.length, "Duplicate Figma ID");
  assert.equal(new Set(tokens.map(variableName)).size, tokens.length, "Duplicate CSS name");

  function resolved(token, mode, seen = new Set()) {
    const selected = selectedMode(token, mode);
    const key = `${token.figmaId}/${selected}`;
    assert.ok(!seen.has(key), "Cyclic token alias");
    const next = new Set([...seen, key]);
    const raw = token.raw[rawMode(token, selected)];
    assert.notEqual(raw, undefined, `Missing raw value: ${key}`);
    const value = token.values[selected];
    if (token.type === "FLOAT") {
      assert.ok(Number.isFinite(value) && value >= 0, "Invalid dimension");
      assert.equal(raw, value, "Dimension differs from raw source");
    } else {
      assert.equal(token.type, "COLOR", "Unexpected token type");
      assert.match(value, /^#[0-9A-F]{6}$/);
      if (raw.type === "VARIABLE_ALIAS") {
        const target = byId.get(raw.id);
        assert.ok(target, "Unresolved token alias");
        assert.equal(resolved(target, selected, next), value, "Alias differs from resolved value");
      } else {
        assert.equal(raw.a, 1, "Unexpected color alpha");
        const hex = `#${[raw.r, raw.g, raw.b].map((v) => {
          assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, "Invalid raw color");
          return Math.round(v * 255).toString(16).padStart(2, "0");
        }).join("").toUpperCase()}`;
        assert.equal(hex, value, "Color differs from raw source");
      }
    }
    return value;
  }
  for (const token of tokens) {
    assert.ok(["approved_product", "brand_exploration_reference"].includes(token.status));
    assert.match(token.figmaName, /^[\w/-]+$/);
    assert.equal(typeof token.collectionName, "string");
    for (const mode of Object.keys(token.values)) resolved(token, mode);
  }
  return tokens;
}

function declaration(token, mode) {
  const selected = selectedMode(token, mode);
  const raw = token.raw[rawMode(token, selected)];
  const value = raw?.type === "VARIABLE_ALIAS"
    ? `var(${variableName(this.get(raw.id))})`
    : `${token.values[selected]}${token.type === "FLOAT" ? "px" : ""}`;
  return `  ${variableName(token)}: ${value}; /* ${token.figmaId} */`;
}

export function generateCss(manifest, rules, override) {
  const tokens = validateTokens(manifest);
  const byId = new Map(tokens.map((t) => [t.figmaId, t]));
  assert.equal(override.id, "ISSUE-HC-01");
  assert.equal(override.property, "--kl-button-destructive-text");
  assert.equal(override.mode, "High contrast");
  assert.equal(override.foregroundToken, "VariableID:2:11");
  assert.equal(override.globalCriticalTokenChanged, false);
  assert.equal(override.fullHighContrastThemeApproved, false);
  const product = tokens.filter((t) => t.status === "approved_product");
  const reference = tokens.filter((t) => t.status === "brand_exploration_reference");
  const block = (selector, list, mode) => `${selector} {\n${list.map((t) => declaration.call(byId, t, mode)).join("\n")}\n}`;
  const typeRules = Object.entries(rules.typography).flatMap(([name, [weight, size, line, tracking]]) => [
    `  --kl-type-${name}-weight: ${weight};`, `  --kl-type-${name}-size: ${size}px;`,
    `  --kl-type-${name}-line: ${line}px;`, `  --kl-type-${name}-tracking: ${tracking}px;`,
  ]);
  const buttonRules = Object.entries(rules.button).map(([name, value]) => {
    const cssName = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    return `  --kl-button-${cssName}: ${value}${name.endsWith("Ms") ? "ms" : name === "disabledOpacity" ? "" : "px"};`;
  });
  const typographyClasses = Object.keys(rules.typography).map((name) => `.kl-type-${name} { font-size: var(--kl-type-${name}-size); line-height: var(--kl-type-${name}-line); font-weight: var(--kl-type-${name}-weight); letter-spacing: var(--kl-type-${name}-tracking); }`).join("\n");
  const [[smallWidth, smallGutter], [largeWidth, largeGutter]] = rules.responsive.mobileSamples;
  const slope = (largeGutter - smallGutter) / (largeWidth - smallWidth);
  const mobileGutter = `clamp(${smallGutter}px, calc(${(slope * 100).toFixed(6)}vw - ${(slope * smallWidth - smallGutter).toFixed(6)}px), ${largeGutter}px)`;
  return [
    "/* Generated by scripts/generate-design-tokens.mjs. Original 61 variables remain in source/tokens.json. */",
    block(":root", product, "Dark"),
    "/* Documented handoff rules; these are not additional original Figma tokens. */",
    `:root {\n${[...typeRules, ...buttonRules, "  --kl-button-destructive-text: var(--kl-color-critical);"].join("\n")}\n}`,
    "/* QA-only context. This does not enable or certify a public High Contrast theme. */",
    block('[data-kl-qa-theme="high-contrast"]', product.filter((t) => Object.hasOwn(t.values, "High contrast")), "High contrast"),
    `[data-kl-qa-theme="high-contrast"] {\n  ${override.property}: var(${variableName(byId.get(override.foregroundToken))}); /* ISSUE-HC-01 */\n}`,
    "/* Exploration references are isolated from product colors and never select a product theme. */",
    block('[data-kl-brand-reference="dark"]', reference, "Dark"),
    block('[data-kl-brand-reference="light"]', reference, "Light"),
    typographyClasses,
    "/* Linear gutter interpolation between the handoff 320/390 samples; 768 is its documented tablet breakpoint. */",
    `:root { --kl-technical-gutter: ${mobileGutter}; --kl-content-max: ${rules.responsive.container}px; }`,
    `@media (min-width: ${rules.responsive.tablet}px) { :root { --kl-technical-gutter: ${rules.responsive.tabletGutter}px; } }`,
    "",
  ].join("\n\n").trimEnd() + "\n";
}

export async function checkGenerated() {
  const [manifest, rules, override] = await Promise.all([
    readJson("design-system/source/tokens.json"), readJson("design-system/implementation.json"), readJson("design-system/overrides.json"),
  ]);
  const expected = generateCss(manifest, rules, override);
  const output = resolve(root, "src/styles/tokens.generated.css");
  return { expected, output };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--check"), "Use no argument or --check");
  const { expected, output } = await checkGenerated();
  if (process.argv[2] === "--check") assert.equal((await readFile(output, "utf8")).replaceAll("\r\n", "\n"), expected, "Generated CSS is stale");
  else { await mkdir(dirname(output), { recursive: true }); await writeFile(output, expected); }
  console.log("PASS: 61 original tokens validated; deterministic CSS and isolated ISSUE-HC-01 mapping.");
}
