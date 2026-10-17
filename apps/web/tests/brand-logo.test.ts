import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandLogo } from "../src/components/brand/BrandLogo";
import { getBrandAsset, type BrandComposition, type BrandSurface } from "../src/lib/design-system/brand-assets";

const compositions: BrandComposition[] = ["Horizontal", "Compact", "Wordmark", "Symbol", "WithSignature", "WithDescriptor"];

describe("BrandLogo", () => {
  for (const composition of compositions) for (const surface of ["Dark", "Light"] as BrandSurface[]) {
    it(`uses the exact ${composition}/${surface} original with proportional geometry`, () => {
      const asset = getBrandAsset(composition, surface);
      const html = renderToStaticMarkup(createElement(BrandLogo, { composition, surface }));
      expect(html).toContain(`src="${asset.src}"`);
      expect(html).toContain(`width="${asset.width}"`);
      expect(html).toContain(`height="${asset.height}"`);
      expect(html).toContain(`width:${asset.displayWidth}px;height:auto`);
      expect(html).toContain('alt="KevoLint');
      expect(html).not.toContain("<svg");
      expect(asset.displayWidth / asset.displayHeight).toBeCloseTo(asset.width / asset.height, 10);
    });
  }
  it("avoids duplicate accessible names when decorative", () => {
    expect(renderToStaticMarkup(createElement(BrandLogo, { decorative: true }))).toContain('alt=""');
    expect(renderToStaticMarkup(createElement(BrandLogo, { label: "KevoLint · Inicio" }))).toContain('alt="KevoLint · Inicio"');
  });
  it.each([16, 24, 32, 48, 64, 128] as const)("uses the original optical %i SVG", (size) => {
    const asset = getBrandAsset("Symbol", "Dark", size);
    expect(asset.src).toBe(`/brand/kevolint-symbol-${size}.svg`);
    expect(asset.width).toBe(size);
  });
  it("rejects unapproved compositions, surfaces and optical combinations", () => {
    // @ts-expect-error Negative runtime contract.
    expect(() => getBrandAsset("Signed", "Dark")).toThrow();
    // @ts-expect-error Negative runtime contract.
    expect(() => getBrandAsset("Horizontal", "Mono")).toThrow();
    expect(() => getBrandAsset("Horizontal", "Dark", 16)).toThrow();
    expect(() => getBrandAsset("Symbol", "Light", 16)).toThrow();
    // @ts-expect-error Negative runtime contract.
    expect(() => getBrandAsset("Symbol", "Dark", 20)).toThrow();
  });
});
