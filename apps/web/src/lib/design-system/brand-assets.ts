import original from "../../../design-system/source/assets.json";
import rules from "../../../design-system/implementation.json";

export type BrandComposition = "Horizontal" | "Compact" | "Wordmark" | "Symbol" | "WithSignature" | "WithDescriptor";
export type BrandSurface = "Dark" | "Light";
export type BrandSize = "minimum" | "original" | 16 | 24 | 32 | 48 | 64 | 128;

const names: Record<BrandComposition, string> = {
  Horizontal: "horizontal", Compact: "compact", Wordmark: "wordmark", Symbol: "symbol",
  WithSignature: "signature", WithDescriptor: "descriptor",
};

export function getBrandAsset(composition: BrandComposition, surface: BrandSurface, size: BrandSize = "minimum") {
  if (!Object.hasOwn(names, composition) || !["Dark", "Light"].includes(surface)) throw new Error("Unapproved brand variant");
  if (!["minimum", "original", 16, 24, 32, 48, 64, 128].includes(size)) throw new Error("Unapproved brand size");
  if (typeof size === "number" && composition !== "Symbol") throw new Error("Optical sizes apply only to Symbol");
  if (surface === "Light" && typeof size === "number" && size !== 64) throw new Error("No original optical Light variant at this size");
  const opticalSize = typeof size === "number" ? size : composition === "Symbol" && surface === "Dark" && size === "minimum" ? 16 : undefined;
  const filename = composition === "Symbol" && surface === "Dark" && opticalSize
    ? `kevolint-symbol-${opticalSize}.svg`
    : `kevolint-${names[composition]}-${surface.toLowerCase()}.svg`;
  const asset = original.assets.find((item) => item.filename === filename);
  if (!asset) throw new Error("Missing approved brand asset");
  const [width, height] = asset.exportedPixelBounds.map(Number);
  const displayWidth = opticalSize ?? (size === "original" || (composition === "Symbol" && surface === "Light") ? width : rules.brandMinimumWidths[composition]);
  return { ...asset, src: `/brand/${filename}`, width, height, displayWidth, displayHeight: displayWidth * height / width };
}
