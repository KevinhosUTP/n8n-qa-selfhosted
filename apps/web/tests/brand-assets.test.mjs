import { describe, expect, it } from "vitest";
import { readFile, mkdtemp, cp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256, validateSvg, verifySources } from "../scripts/verify-design-sources.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const original = JSON.parse(await readFile(resolve(root, "design-system/source/assets.json"), "utf8"));

describe("Approved original sources", () => {
  it("preserves every manifest, SVG, font and license byte", async () => {
    expect(await verifySources(root)).toEqual({ svgCount: 24, sourceCount: 9, fontVersion: "4.1" });
  });
  it.each(original.assets)("validates original $filename", async (asset) => {
    validateSvg(asset, await readFile(resolve(root, "public/brand", asset.filename)));
  });
  it("rejects altered SVG bytes, dimensions and active content", async () => {
    const asset = original.assets[0];
    const bytes = await readFile(resolve(root, "public/brand", asset.filename));
    expect(() => validateSvg(asset, Buffer.concat([bytes, Buffer.from("\n")]))).toThrow();
    expect(() => validateSvg({ ...asset, exportedViewBox: "0 0 1 1" }, bytes)).toThrow();
    const active = Buffer.from('<svg width="1" height="1" viewBox="0 0 1 1"><script>alert(1)</script></svg>');
    expect(() => validateSvg({ ...asset, bytes: active.length, sha256: sha256(active) }, active)).toThrow();
  });
  it.each(["missing SVG", "missing license", "tampered manifest", "extra SVG"])("rejects %s in a temporary distribution", async (kind) => {
    const dir = await mkdtemp(resolve(tmpdir(), "kevolint-design-"));
    try {
      for (const name of ["design-system", "public", "src/assets/fonts"]) await cp(resolve(root, name), resolve(dir, name), { recursive: true });
      if (kind === "missing SVG") await rm(resolve(dir, "public/brand", original.assets[0].filename));
      if (kind === "missing license") await rm(resolve(dir, "public/licenses/inter/LICENSE.txt"));
      if (kind === "tampered manifest") await writeFile(resolve(dir, "design-system/source/tokens.json"), "{}");
      if (kind === "extra SVG") await writeFile(resolve(dir, "public/brand/unapproved.svg"), "<svg/>");
      await expect(verifySources(dir)).rejects.toThrow();
    } finally {
      expect(dirname(resolve(dir))).toBe(resolve(tmpdir()));
      await rm(dir, { recursive: true, force: true });
    }
  });
});
