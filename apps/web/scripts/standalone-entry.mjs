import assert from "node:assert/strict";
import { access, cp } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export async function prepareStandalone() {
  const candidates = [".next/standalone/server.js", ".next/standalone/apps/web/server.js"];
  let entry;
  for (const candidate of candidates) {
    try { await access(candidate); entry = resolve(candidate); break; } catch { /* try next layout */ }
  }
  assert.ok(entry, "Standalone build missing. Run npm run build first.");
  const root = dirname(entry);
  await cp(resolve(".next/static"), join(root, ".next/static"), { recursive: true });
  // Next deliberately leaves static/public assets out of standalone tracing.
  try {
    await access("public");
    await cp(resolve("public"), join(root, "public"), { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return entry;
}
