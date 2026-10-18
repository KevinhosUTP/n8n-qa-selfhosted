import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { testEnvironment } from "./test-environment.mjs";
import { assertNoDesignPreview } from "./check-design-build.mjs";

await assertNoDesignPreview(process.cwd());
const preview = spawn(process.execPath, ["scripts/public-preview.mjs"], {
  env: testEnvironment({ NODE_ENV: "development" }), stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true,
});
let startupError;
preview.once("error", (error) => { startupError = error; });
try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    assert.ok(!startupError && preview.exitCode === null, "Design preview failed to start");
    try {
      const response = await fetch("http://127.0.0.1:3103/pr03-public-preview", { signal: AbortSignal.timeout(1000) });
      if (response.status === 200 && (await response.text()).includes("PR03 · Fixture local")) { ready = true; break; }
    } catch { /* startup in progress */ }
    await delay(200);
  }
  assert.ok(ready, "Design preview did not become ready");
  const check = spawn(process.execPath, ["scripts/check-public-browser.mjs"], { stdio: "inherit", windowsHide: true });
  const limit = setTimeout(() => check.kill(), 180_000);
  try {
    const [code] = await once(check, "exit");
    assert.equal(code, 0, "Real-browser design verification failed");
  } finally { clearTimeout(limit); }
  const report = JSON.parse(await readFile(resolve("../../.tools/pr03/browser/report.json"), "utf8"));
  assert.equal(report.passed, true);
  const summary = `## PR03 · Public navigation in real browser\n\nRevision: ${report.sourceRevision}; browser: ${report.browser.product}.\n\nPASS: ${report.responsive.length} viewport samples; modal keyboard/pointer, focus/inert background, scroll restoration, viewport change, route/history, modifiers and fixture unmount.\n\nPending routes: ${report.pendingRoutes.length} real HTTP 404 responses; these pages are not implemented.\n\nNot claimed: integral WCAG certification, screen-reader testing, manual browser-menu zoom or exhaustive browser/OS coverage.`;
  console.log(summary);
  if (process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
} finally {
  if (preview.exitCode === null && !startupError) {
    const exited = once(preview, "exit");
    preview.send("stop");
    await Promise.race([exited, delay(10_000).then(() => { throw new Error("Preview cleanup did not finish"); })]);
  }
  await assertNoDesignPreview(process.cwd());
}
