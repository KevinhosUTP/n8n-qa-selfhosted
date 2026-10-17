import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const source = JSON.parse(await readFile(new URL("../design-system/source/tokens.json", import.meta.url), "utf8"));
const color = (name, mode = "Dark") => source.tokens.find((t) => t.figmaName === `color/${name}`).values[mode];
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((c) => parseInt(c, 16) / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe("Token contrast regression; not a substitute for rendered accessibility checks", () => {
  it("keeps the original HC defect visible in the immutable source", () => {
    expect(contrast(color("critical", "High contrast"), color("destructive-default", "High contrast"))).toBeCloseTo(2.18, 2);
  });
  it.each(["destructive-default", "destructive-hover", "destructive-pressed"])("corrected HC foreground passes on %s", (bg) => {
    expect(contrast(color("background", "High contrast"), color(bg, "High contrast"))).toBeCloseTo(19.68, 2);
  });
  it.each(["destructive-default", "destructive-hover", "destructive-pressed"])("Dark destructive text passes on %s", (bg) => {
    expect(contrast(color("critical"), color(bg))).toBeGreaterThanOrEqual(4.5);
  });
  it.each([["text", "background"], ["muted", "background"], ["text", "surface"], ["background", "accent"]])("Dark %s on %s passes text AA", (fg, bg) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
  });
  it("uses an accessible control border rather than the decorative divider", () => {
    expect(contrast(color("control-border"), color("surface"))).toBeGreaterThanOrEqual(3);
    expect(contrast(color("border"), color("surface"))).toBeLessThan(3);
  });
});
