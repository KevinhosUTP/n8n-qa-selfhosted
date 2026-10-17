import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile, unlink, rmdir } from "node:fs/promises";
import { resolve } from "node:path";
import { testEnvironment } from "./test-environment.mjs";

// A transient route forces Next's compiler to exercise the real client/server boundary.
// mkdir fails if it already exists; never overwrite user files. Nothing is deployed.
const directory = resolve("src/app/pr01-client-boundary-fixture");
const page = resolve(directory, "page.tsx");
await mkdir(directory);
try {
  await writeFile(page, '"use client";\nimport { getServerConfig } from "@/lib/config/server";\nexport default function Fixture() { return <p>{getServerConfig().runtime}</p>; }\n', { flag: "wx" });
  const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    env: testEnvironment(), encoding: "utf8", timeout: 120_000, maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, "Boundary build could not execute.");
  assert.notEqual(result.status, 0, "Next accepted a server-only import in a Client Component.");
  assert.match(`${result.stdout}\n${result.stderr}`, /server-only/, "Build failed for an unrelated reason.");
  console.log("PASS: Next rejects server-only code imported by a Client Component.");
} finally {
  await unlink(page);
  await rmdir(directory);
}

const marker = "synthetic-pr01-rejected-public-value";
const invalidPublic = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "typegen"], {
  env: testEnvironment({ NEXT_PUBLIC_UNREVIEWED: marker }),
  encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024,
});
assert.equal(invalidPublic.error, undefined, "Public configuration check could not execute.");
assert.notEqual(invalidPublic.status, 0, "Next accepted unreviewed public configuration.");
const output = `${invalidPublic.stdout}\n${invalidPublic.stderr}`;
assert.match(output, /Invalid public environment configuration/);
assert.ok(!output.includes(marker), "Rejected public input leaked through the configuration error.");
console.log("PASS: Next rejects unreviewed public environment without disclosing its value.");
