import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function validateSvg(asset, bytes) {
  assert.equal(sha256(bytes), asset.sha256, `SVG integrity mismatch: ${asset.filename}`);
  assert.equal(bytes.length, asset.bytes);
  const svg = bytes.toString("utf8");
  assert.ok(!/<(?:script|foreignObject|image|text|use)\b|\bon\w+\s*=|\b(?:href|xlink:href)\s*=/i.test(svg), "Unexpected active, external or font-dependent SVG content");
  const root = svg.match(/<svg\b([^>]+)>/);
  assert.ok(root, "Missing SVG root");
  for (const [name, expected] of [["viewBox", asset.exportedViewBox], ["width", asset.exportedPixelBounds[0]], ["height", asset.exportedPixelBounds[1]]]) {
    assert.equal(root[1].match(new RegExp(`\\b${name}="([^"]+)"`))?.[1], expected, `Unexpected SVG ${name}`);
  }
}

export async function verifySources(root) {
  const json = async (p) => JSON.parse(await readFile(resolve(root, p), "utf8"));
  const [provenance, assets, font] = await Promise.all([
    json("design-system/provenance.json"), json("design-system/source/assets.json"), json("design-system/inter.json"),
  ]);
  for (const { filename, sha256: digest } of provenance.sourceFiles) {
    assert.match(filename, /^[\w.-]+$/);
    assert.equal(sha256(await readFile(resolve(root, "design-system/source", filename))), digest, `Original source changed: ${filename}`);
  }
  assert.equal(assets.assets.length, 24);
  const files = (await readdir(resolve(root, "public/brand"))).sort();
  assert.deepEqual(files, assets.assets.map((a) => a.filename).sort(), "Missing or unregistered brand resource");
  for (const asset of assets.assets) validateSvg(asset, await readFile(resolve(root, "public/brand", asset.filename)));
  assert.equal(font.version, "4.1");
  assert.equal(sha256(await readFile(resolve(root, font.fontPath))), font.fontSha256, "Font integrity mismatch");
  const license = await readFile(resolve(root, font.licensePath));
  assert.equal(sha256(license), font.licenseSha256, "Font license integrity mismatch");
  assert.match(license.toString("utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
  return { svgCount: assets.assets.length, sourceCount: provenance.sourceFiles.length, fontVersion: font.version };
}
