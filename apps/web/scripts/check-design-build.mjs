import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function assertNoDesignPreview(root) {
  for (const [stage, path] of [["PR02", "src/app/pr02-design-preview"], ["PR03", "src/app/pr03-public-preview"], ["PR05a", "src/app/pr05a-shared-ui-preview"], ["PR05b", "src/app/pr05b-modal-feedback-preview"]]) {
    try { await access(resolve(root, path)); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    assert.fail(`Temporary ${stage} preview route exists. Stop its preview and remove its owned fixture before a production build.`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await assertNoDesignPreview(process.cwd());
  console.log("PASS: temporary design preview route is absent from the production source tree.");
}
