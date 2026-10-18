import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, unlink, rmdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { testEnvironment } from "./test-environment.mjs";

const directory = resolve("src/app/pr03-public-preview");
const page = resolve(directory, "page.tsx");
// Refuse to overwrite any existing route. No runtime flag can enable this in a build.
await mkdir(directory);
let child;
let cleanupPromise;
function stopPreview() {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    // Terminate only this owned Next child and its worker tree. Windows SIGTERM
    // cannot reliably run a Node child's signal handlers.
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  } else child.kill("SIGTERM");
}
async function cleanup() {
  cleanupPromise ??= (async () => {
    await unlink(page).catch((e) => { if (e.code !== "ENOENT") throw e; });
    await rmdir(directory);
    // Next includes dev route types in tsconfig. Do not leave references to the
    // removed fixture behind when switching back to a production typecheck.
    const generatedTypes = resolve(".next/dev/types");
    assert.equal(dirname(generatedTypes), resolve(".next/dev"));
    await rm(generatedTypes, { recursive: true, force: true });
  })();
  return cleanupPromise;
}
try {
  await writeFile(page, await readFile("tests/fixtures/public-layout-preview.tsx"), { flag: "wx" });
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3103"], {
    env: testEnvironment({ NODE_ENV: "development" }), stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, stopPreview);
  process.on("message", (message) => { if (message === "stop") stopPreview(); });
  child.on("error", async (error) => { console.error(error.message); await cleanup(); process.exitCode = 1; if (process.connected) process.disconnect(); });
  child.on("exit", async (code) => { await cleanup(); process.exitCode = code ?? 0; if (process.connected) process.disconnect(); });
} catch (error) {
  await cleanup();
  throw error;
}
