import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { testEnvironment } from "./test-environment.mjs";
import { prepareStandalone } from "./standalone-entry.mjs";

const marker = "synthetic-pr01-server-canary";
const entry = await prepareStandalone();
const runtimeRoot = dirname(entry);

const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const { port } = socket.address();
await new Promise((resolveClose) => socket.close(resolveClose));

const child = spawn(process.execPath, [entry], {
  cwd: runtimeRoot,
  env: testEnvironment({ PORT: String(port), HOSTNAME: "127.0.0.1", KEVOLINT_SERVER_CANARY: marker }),
  stdio: ["ignore", "pipe", "pipe"],
});
// Consume logs without printing environment data on failure.
child.stdout.resume();
child.stderr.resume();
let spawnError;
child.on("error", (error) => { spawnError = error; });
const origin = `http://127.0.0.1:${port}`;

async function assertNoMarker(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) await assertNoMarker(path);
    else if (/\.(js|html|json|txt|rsc)$/.test(item.name)) {
      assert.ok(!(await readFile(path, "utf8")).includes(marker), "Server-only value found in generated output.");
    }
  }
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    assert.ok(!spawnError && child.exitCode === null, "Standalone server failed to start.");
    try {
      if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).status === 200) { ready = true; break; }
    } catch { /* startup in progress */ }
    await delay(200);
  }
  assert.ok(ready, "Standalone server did not become ready.");

  const pendingPublic = ["/como-funciona", "/seguridad", "/precios", "/ayuda", "/legal/terminos", "/legal/privacidad", "/legal/cookies", "/sign-in", "/sign-up"];
  for (const [path, status] of [["/", 200], ["/pr01-missing-page", 404], ["/app", 404], ["/api/audits", 404], ["/pr02-design-preview", 404], ["/pr03-public-preview", 404], ...pendingPublic.map((path) => [path, 404])]) {
    const response = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, status, `Unexpected HTTP status for ${path}`);
    const body = await response.text();
    assert.ok(body.includes(path === "/" ? "Base técnica de desarrollo" : "Página no encontrada"));
    assert.ok(!body.includes(marker), "Server-only configuration leaked into HTML.");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("content-security-policy"), null);

    if (path === "/") {
      const localFont = JSON.parse(await readFile("design-system/inter.json", "utf8"));
      const fonts = [...body.matchAll(/<link[^>]+href="([^"]+\.woff2(?:\?[^"]*)?)"[^>]*>/g)];
      assert.ok(fonts.length > 0, "No local font preload in production HTML");
      for (const [, font] of fonts) {
        const url = new URL(font, origin);
        assert.equal(url.origin, origin, "External font request");
        const responseFont = await fetch(url, { signal: AbortSignal.timeout(5000) });
        assert.equal(responseFont.status, 200);
        assert.equal(createHash("sha256").update(Buffer.from(await responseFont.arrayBuffer())).digest("hex"), localFont.fontSha256, "Production font differs from official binary");
      }
      assert.ok(!body.includes("data-kl-qa-theme"), "Unvalidated theme enabled on the production page");
      const original = JSON.parse(await readFile("design-system/source/assets.json", "utf8"));
      for (const asset of original.assets) {
        const responseAsset = await fetch(`${origin}/brand/${asset.filename}`, { signal: AbortSignal.timeout(5000) });
        assert.equal(responseAsset.status, 200, `Original SVG unavailable: ${asset.filename}`);
        assert.equal(createHash("sha256").update(Buffer.from(await responseAsset.arrayBuffer())).digest("hex"), asset.sha256, "Published SVG integrity mismatch");
      }
      const license = await fetch(`${origin}/licenses/inter/LICENSE.txt`, { signal: AbortSignal.timeout(5000) });
      assert.equal(license.status, 200);
      assert.equal(createHash("sha256").update(Buffer.from(await license.arrayBuffer())).digest("hex"), localFont.licenseSha256);
      console.log("PASS: 24 published original SVGs, local Inter binary and OFL license retain their approved hashes.");
    }

    for (const [, asset] of body.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      const assetUrl = new URL(asset, origin);
      assert.equal(assetUrl.origin, origin, "Unexpected third-party script.");
      const script = await fetch(assetUrl, { signal: AbortSignal.timeout(5000) });
      assert.equal(script.status, 200, "Standalone static asset unavailable.");
      assert.ok(!(await script.text()).includes(marker), "Server-only value leaked into a script.");
    }
    console.log(`PASS: HTTP ${status} ${path}, security headers and same-origin scripts.`);
  }
  const post = await fetch(`${origin}/api/audits`, { method: "POST", signal: AbortSignal.timeout(5000) });
  assert.equal(post.status, 404, "A business endpoint must not exist in PR01.");
  await assertNoMarker(resolve(".next/static"));
  await assertNoMarker(resolve(".next/server/app"));
  console.log("PASS: credential-free standalone runtime; no business endpoint or public canary.");
} finally {
  if (child.exitCode === null && !spawnError) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await Promise.race([exited, delay(5000)]);
    if (child.exitCode === null) { child.kill("SIGKILL"); await exited; }
  }
}
