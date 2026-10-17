import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Official CLI, no GitHub App/license token or production credentials required.
const version = "8.30.1";
assert.equal(process.arch, "x64", "Secret scanner bootstrap currently supports x64 runners.");
assert.ok(["win32", "linux"].includes(process.platform), "Use the official Gitleaks CLI on this platform.");
const windows = process.platform === "win32";
const filename = `gitleaks_${version}_${windows ? "windows_x64.zip" : "linux_x64.tar.gz"}`;
const base = `https://github.com/gitleaks/gitleaks/releases/download/v${version}/`;
const directory = resolve(".tools/gitleaks");
await mkdir(directory, { recursive: true });

async function download(name) {
  const response = await fetch(`${base}${name}`, { signal: AbortSignal.timeout(60_000) });
  assert.ok(response.ok, "Unable to download official scanner resources.");
  return Buffer.from(await response.arrayBuffer());
}

const checksums = (await download(`gitleaks_${version}_checksums.txt`)).toString("utf8");
const archive = await download(filename);
const checksum = checksums.split(/\r?\n/).find((line) => line.trim().endsWith(` ${filename}`))?.split(/\s+/)[0];
assert.ok(checksum, "Release checksum missing.");
assert.equal(createHash("sha256").update(archive).digest("hex"), checksum, "Scanner checksum mismatch.");
const archivePath = resolve(directory, filename);
await writeFile(archivePath, archive);
const binary = windows ? "gitleaks.exe" : "gitleaks";
const extracted = spawnSync("tar", ["-xf", archivePath, "-C", directory, binary], { stdio: "inherit" });
assert.equal(extracted.status, 0, "Unable to extract scanner.");
const result = spawnSync(resolve(directory, binary), ["git", ".", "--redact", "--no-banner", "--exit-code", "1"], { stdio: "inherit" });
assert.equal(result.status, 0, "Secret scan did not pass; inspect redacted findings or scanner errors.");
