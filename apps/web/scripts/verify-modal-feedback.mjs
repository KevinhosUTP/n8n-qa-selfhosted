import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { testEnvironment } from "./test-environment.mjs";
import { assertNoDesignPreview } from "./check-design-build.mjs";

await assertNoDesignPreview(process.cwd());
const preview = spawn(process.execPath, ["scripts/modal-feedback-preview.mjs"], {
  env: testEnvironment({ NODE_ENV: "development" }), stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true,
});
let startupError;
preview.once("error", (error) => { startupError = error; });
try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    assert.ok(!startupError && preview.exitCode === null, "Design preview failed to start");
    try {
      const response = await fetch("http://127.0.0.1:3106/pr05b-modal-feedback-preview", { signal: AbortSignal.timeout(1000) });
      if (response.status === 200 && (await response.text()).includes("PR05b · Fixture local")) { ready = true; break; }
    } catch { /* startup in progress */ }
    await delay(200);
  }
  assert.ok(ready, "Design preview did not become ready");
  const check = spawn(process.execPath, ["scripts/check-modal-feedback-browser.mjs"], { stdio: "inherit", windowsHide: true });
  const limit = setTimeout(() => check.kill(), 120_000);
  try {
    const [code] = await once(check, "exit");
    assert.equal(code, 0, "Real-browser design verification failed");
  } finally { clearTimeout(limit); }
  const report = JSON.parse(await readFile(resolve("../../.tools/pr05b/browser/report.json"), "utf8"));
  assert.equal(report.passed, true);
  const summary = `## PR05b shared UI · browser verification

Revision: ${report.sourceRevision}; browser: ${report.browser.product}.

PASS: ${report.responsive.length} viewport samples, native modals, controlled close reasons, focus/scroll lifecycle, Toast region and Off/On review.

Checkbox/Switch: ${report.choiceAccessibility.responsive.length} viewports, effective graphic/text/focus contrast, approved mark/thumb geometry, disabled/error/surface states, native keyboard/pointer/reset/FormData, forced-colors and reduced motion. Post-reset React event counts are compared with an undecorated native reference: ${JSON.stringify(report.choiceAccessibility.nativeResetEventComparison)}.

Axe pending: not installed or substituted. Screen reader, native zoom, physical devices and exhaustive WCAG verification not claimed.`;
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
