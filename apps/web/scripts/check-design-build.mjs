import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function assertNoDesignPreview(root) {
  try { await access(resolve(root, "src/app/pr02-design-preview")); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  assert.fail("Temporary PR02 preview route exists. Stop design:preview and remove its owned fixture before a production build.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await assertNoDesignPreview(process.cwd());
  console.log("PASS: temporary design preview route is absent from the production source tree.");
}
