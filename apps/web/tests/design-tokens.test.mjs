import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { checkGenerated, generateCss, validateTokens, variableName } from "../scripts/generate-design-tokens.mjs";

const json = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf8"));
const source = await json("../design-system/source/tokens.json");
const rules = await json("../design-system/implementation.json");
const override = await json("../design-system/overrides.json");

describe("Original tokens and deterministic generation", () => {
  it("maps all 61 original variables without altering the source", () => {
    const before = JSON.stringify(source);
    const css = generateCss(source, rules, override);
    expect(validateTokens(source)).toHaveLength(61);
    for (const token of source.tokens) expect(css).toContain(`${variableName(token)}:`);
    expect(new Set(source.tokens.map(variableName)).size).toBe(61);
    expect(JSON.stringify(source)).toBe(before);
  });
  it("keeps the committed CSS reproducible", async () => {
    const { expected, output } = await checkGenerated();
    expect((await readFile(output, "utf8")).replaceAll("\r\n", "\n")).toBe(expected);
    expect(generateCss(structuredClone(source), rules, override)).toBe(expected);
  });
  it("isolates exploration and HC from the default product theme", () => {
    const css = generateCss(source, rules, override);
    const defaultBlock = css.slice(css.indexOf(":root {"), css.indexOf("\n}"));
    expect(defaultBlock).not.toContain("--kl-reference-");
    expect(css).toContain('[data-kl-qa-theme="high-contrast"]');
    expect(css).not.toMatch(/prefers-color-scheme|data-theme=/);
    expect(override.fullHighContrastThemeApproved).toBe(false);
  });
  it.each([
    ["missing token", (m) => m.tokens.pop()],
    ["duplicate ID", (m) => { m.tokens[1].figmaId = m.tokens[0].figmaId; }],
    ["duplicate CSS name", (m) => { m.tokens[1].figmaName = m.tokens[0].figmaName; }],
    ["unknown type", (m) => { m.tokens[0].type = "SHADOW"; }],
    ["unknown status", (m) => { m.tokens[0].status = "simulation"; }],
    ["invalid color", (m) => { m.tokens[0].values.Value = "red"; }],
    ["unresolved alias", (m) => { m.tokens[1].raw["2:1"].id = "missing"; }],
    ["cycle", (m) => { m.tokens[1].raw["2:1"].id = m.tokens[1].figmaId; }],
    ["inconsistent resolved value", (m) => { m.tokens[1].values.Dark = "#FFFFFF"; }],
    ["missing raw mode", (m) => { delete m.tokens[1].raw["38:0"]; }],
  ])("rejects %s", (_, mutate) => {
    const changed = structuredClone(source);
    mutate(changed);
    expect(() => validateTokens(changed)).toThrow();
  });
  it("rejects widening the HC exception", () => {
    expect(() => generateCss(source, rules, { ...override, globalCriticalTokenChanged: true })).toThrow();
    expect(() => generateCss(source, rules, { ...override, fullHighContrastThemeApproved: true })).toThrow();
  });
});
