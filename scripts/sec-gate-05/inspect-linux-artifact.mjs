// Diagnostic evidence only. Never grants, replaces or exports SEC acceptance.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, readdir, lstat, realpath, mkdtemp, rm, symlink } from "node:fs/promises";
import { dirname, join, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir, release, arch } from "node:os";
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const web = join(repository, "apps/web");
const output = join(repository, ".tools/sec-gate-05-evidence");
const expectedBase = "d559c4215ee8297baaf9f8a991c6a0e15a4fdb6f";
const expectedLock = "06afe398ca0ac47c1d8dcef2ced4a773f6d7f66f44a947b98b79f66cf10b927c";
const repo = "KevinhosUTP/n8n-qa-selfhosted";
const branch = "codex/kevolint-sec-gate-05-diagnostics";
const baseBranch = "codex/kevolint-sec-gate-04-linux";
const allowed = [".github/workflows/sec-gate-05-diagnostic.yml", "scripts/sec-gate-05/inspect-linux-artifact.mjs"];
const affected = ["@next/eslint-plugin-next", "fast-glob", "micromatch", "braces"];
const versions = ["16.4.2", "3.3.1", "4.0.8", "3.0.3"];
const sha = b => createHash("sha256").update(b).digest("hex");
const json = async p => JSON.parse(await readFile(p, "utf8"));
const slash = p => p.replaceAll("\\", "/");
const save = async (name, data) => { await mkdir(output, { recursive: true }); await writeFile(join(output, name), JSON.stringify(data, null, 2) + "\n"); };
const cleanEnvironment = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(path|systemroot|windir|home|userprofile|temp|tmp|comspec|pathext|lang|lc_all|tz)$/i.test(k))), NEXT_TELEMETRY_DISABLED: "1", NPM_CONFIG_REGISTRY: "https://registry.npmjs.org", NPM_CONFIG_STRICT_SSL: "true", NPM_CONFIG_USERCONFIG: process.platform === "win32" ? "nul" : "/dev/null", NPM_CONFIG_GLOBALCONFIG: process.platform === "win32" ? "nul" : "/dev/null" });
async function processRun(command, args, { cwd = web, timeout = 120000 } = {}) {
  return await new Promise(done => {
    let stdout = "", stderr = "", error = null, timedOut = false;
    const startedAt = new Date().toISOString();
    const child = spawn(command, args, { cwd, env: cleanEnvironment(), shell: false, windowsHide: true, detached: process.platform !== "win32" });
    const timer = setTimeout(() => { timedOut = true; try { if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL"); else child.kill("SIGKILL"); } catch (e) { if (e.code !== "ESRCH") error = e.message; } }, timeout);
    child.stdout.on("data", x => { stdout += x; }); child.stderr.on("data", x => { stderr += x; });
    child.once("error", e => { error = e.message; });
    child.once("close", (code, signal) => { clearTimeout(timer); done({ command, args, startedAt, finishedAt: new Date().toISOString(), code, signal, error, timedOut, stdout, stderr }); });
  });
}
async function git(args) { const r = await processRun("git", args, { cwd: repository }); assert.equal(r.code, 0, "Git verification failed"); return r.stdout.trim(); }
function processOkay(p, codes = [0]) { assert.ok(!p.error && !p.timedOut && !p.signal, "Process/network/timeout failure"); assert.ok(codes.includes(p.code), `Unexpected process exit ${p.code}`); }
async function captured(id, command, args, options) {
  assert.match(id, /^[a-z0-9-]+$/); const p = await processRun(command, args, options);
  await save(`${id}.process.json`, p); console.log(p.stdout); if (p.stderr) console.error(p.stderr); return p;
}
function validateIdentity(event, environment, checkedOut, parents, names) {
  const pr = event.pull_request;
  assert.equal(environment.GITHUB_EVENT_NAME, "pull_request"); assert.equal(environment.GITHUB_REPOSITORY, repo);
  assert.equal(event.repository.full_name, repo); assert.equal(pr.head.repo.full_name, repo); assert.equal(pr.base.repo.full_name, repo); assert.equal(pr.head.repo.fork, false);
  assert.equal(pr.draft, true); assert.equal(pr.head.ref, branch); assert.equal(pr.base.ref, baseBranch); assert.equal(pr.base.sha, expectedBase);
  assert.match(pr.head.sha, /^[a-f0-9]{40}$/); assert.equal(checkedOut, pr.head.sha); assert.deepEqual(parents, [expectedBase]);
  assert.equal(environment.GITHUB_HEAD_REF, branch); assert.equal(environment.GITHUB_BASE_REF, baseBranch);
  assert.equal(environment.GITHUB_REF, `refs/pull/${event.number}/merge`);
  assert.equal(environment.GITHUB_WORKFLOW_REF, `${repo}/.github/workflows/sec-gate-05-diagnostic.yml@${environment.GITHUB_REF}`);
  assert.match(environment.GITHUB_SHA, /^[a-f0-9]{40}$/); assert.deepEqual(names.sort(), allowed.map(n => `A\t${n}`).sort());
}
async function preflight() {
  assert.equal(process.platform, "linux", "Linux diagnostic required");
  const event = await json(process.env.GITHUB_EVENT_PATH); const revision = await git(["rev-parse", "HEAD"]);
  const parents = (await git(["show", "-s", "--format=%P", "HEAD"])).split(" ");
  const names = (await git(["diff", "--name-status", `${expectedBase}..HEAD`])).split("\n");
  validateIdentity(event, process.env, revision, parents, names);
  assert.equal(await git(["show", "-s", "--format=%s", "HEAD"]), "test(sec): collect isolated Linux artifact evidence");
  assert.equal(await git(["rev-list", "--count", `${expectedBase}..HEAD`]), "1");
  const lock = await readFile(join(web, "package-lock.json")); assert.equal(sha(lock), expectedLock);
  for (const p of ["apps/web/package.json", "apps/web/package-lock.json", ".github/security/sec-pr01-01.json", "apps/web/scripts/security-control.mjs", ".github/workflows/frontend-checks.yml", "docs/security-backlog.md"]) {
    const actual = await readFile(join(repository, p)); const committed = await processRun("git", ["show", `${expectedBase}:${p}`], { cwd: repository });
    processOkay(committed); assert.equal(sha(actual), sha(Buffer.from(committed.stdout)), `Protected file differs: ${p}`);
  }
  const npm = await processRun("npm", ["--version"]); processOkay(npm); assert.equal(npm.stdout.trim(), "10.9.3"); assert.equal(process.version, "v22.20.0");
  const context = { diagnosticOnly: true, secAcceptance: false, revision, eventMergeRevision: process.env.GITHUB_SHA, eventRef: process.env.GITHUB_REF, workflowRef: process.env.GITHUB_WORKFLOW_REF, head: event.pull_request.head.sha, base: expectedBase, pr: event.number, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT, node: process.version, npm: npm.stdout.trim(), os: process.platform, kernel: release(), arch: arch(), lockSha256: sha(lock), inspectedAt: new Date().toISOString() };
  await save("context.json", context); console.log(JSON.stringify(context));
}
function classifyAudit(p, reference) {
  processOkay(p, [0, 1]); assert.equal(p.stderr.trim(), ""); const report = JSON.parse(p.stdout);
  assert.equal(report.auditReportVersion, 2); assert.ok(!report.error && report.metadata && report.vulnerabilities);
  assert.equal(p.code, Object.keys(report.vulnerabilities).length ? 1 : 0);
  const normalized = structuredClone(report.vulnerabilities);
  for (const node of Object.values(normalized)) {
    assert.ok(Array.isArray(node.via) && node.via.length > 0);
    for (const v of node.via) if (typeof v !== "string") {
      assert.ok(Number.isInteger(v.source) && v.source > 0 && typeof v.title === "string" && v.title.length > 0);
      // npm numeric row IDs and human-readable titles are not advisory identity.
      // Every remaining advisory field and the entire transitively affected graph must match.
      v.source = 1; v.title = "Synthetic approved root advisory fixture";
    }
  }
  assert.deepEqual(normalized, reference.vulnerabilities, "Additional or changed advisory/node/severity");
  assert.deepEqual(report.metadata.dependencies, { prod: 29, dev: 211, optional: 65, peer: 34, peerOptional: 0, total: 277 }); assert.equal(report.metadata.vulnerabilities.high, 4); assert.equal(report.metadata.vulnerabilities.total, 4);
  for (const severity of ["info", "low", "moderate", "critical"]) assert.equal(report.metadata.vulnerabilities[severity], 0);
  return { report, diagnosticOnly: true, secAcceptance: false, actualAuditExitCode: p.code, knownVulnerabilitiesRemain: true, additionalAdvisories: [] };
}
async function audit() {
  const p = await captured("audit", "npm", ["audit", "--include=dev", "--json", "--audit-level=low"]);
  const reference = await json(join(web, "tests/fixtures/security-audit.json"));
  const report = classifyAudit(p, reference); await save("audit-complete.json", report.report); await save("audit-classification.json", { ...report, report: undefined });
  console.log("Audit retained: four original HIGH nodes remain; diagnostic collection only, NO SEC acceptance.");
}
function runtimeClosure(packages, starts) {
  const seen = new Set();
  const find = (from, name) => { let p = from; for (;;) { const key = `${p ? p + "/" : ""}node_modules/${name}`; if (packages[key]) return key; if (!p) return null; const i = p.lastIndexOf("/node_modules/"); p = i < 0 ? "" : p.slice(0, i); } };
  const visit = key => { if (seen.has(key)) return; seen.add(key); const p = packages[key]; for (const n of Object.keys({ ...p.dependencies, ...p.optionalDependencies })) { const target = find(key, n); if (!target) { assert.ok(p.optionalDependencies?.[n], `Unresolved runtime dependency ${n}`); continue; } visit(target); } };
  for (const n of starts) { const key = find("", n); assert.ok(key); visit(key); } return [...seen].sort();
}
async function installed() {
  const lock = await json(join(web, "package-lock.json")); assert.equal(sha(await readFile(join(web, "package-lock.json"))), expectedLock);
  const tree = await captured("installed-tree", "npm", ["ls", "--all", "--json"]); processOkay(tree); await save("installed-tree.json", JSON.parse(tree.stdout));
  const explain = await captured("affected-chain", "npm", ["explain", ...affected, "--json"]); processOkay(explain); await save("affected-chain.json", JSON.parse(explain.stdout));
  const signatures = await captured("signatures", "npm", ["audit", "signatures", "--json"]); processOkay(signatures); const signed = JSON.parse(signatures.stdout); assert.deepEqual(signed.invalid, []); assert.deepEqual(signed.missing, []);
  const require = createRequire(join(web, "package.json")); let parent = join(web, "package.json"); const resolved = [];
  for (const [i, name] of affected.entries()) {
    const p = await realpath(createRequire(parent).resolve(`${name}/package.json`)); assert.ok(p.startsWith(await realpath(join(web, "node_modules")) + "/"));
    const d = await json(p); const key = slash(relative(web, dirname(p))); assert.equal(key, `node_modules/${name}`); assert.equal(d.version, versions[i]); assert.equal(lock.packages[key].dev, true); assert.deepEqual(d.dependencies, lock.packages[key].dependencies);
    resolved.push({ name, version: d.version, path: key, dev: true }); parent = p;
  }
  const { ESLint } = require("eslint"); const plugin = require("@next/eslint-plugin-next"); const rules = { ...plugin.configs.recommended.rules, ...plugin.configs["core-web-vitals"].rules }; assert.equal(Object.keys(rules).length, 22);
  const lint = new ESLint({ cwd: web }); const results = await lint.lintFiles(["."]); assert.ok(results.length); const configs = [];
  for (const f of results) { assert.equal(f.errorCount + f.warningCount, 0); const c = await lint.calculateConfigForFile(f.filePath); assert.ok(!Object.hasOwn(c.settings?.next ?? {}, "rootDir")); if (/\.tsx?$/.test(f.filePath)) for (const [name, val] of Object.entries(rules)) assert.equal(c.rules[name][0], (Array.isArray(val) ? val[0] : val) === "error" ? 2 : 1, name); configs.push({ path: slash(relative(web, f.filePath)), rulesSha256: sha(JSON.stringify(c.rules)), rootDir: "absent" }); }
  const closure = runtimeClosure(lock.packages, ["@clerk/nextjs"]); assert.ok(!closure.some(p => lock.packages[p].dev === true || affected.some(n => p.endsWith(`node_modules/${n}`))));
  await save("installed-validation.json", { diagnosticOnly: true, secAcceptance: false, lockSha256: expectedLock, resolvedAffectedDevChain: resolved, effectiveConfigs: configs, clerkRuntimeClosure: closure.map(p => ({ path: p, version: lock.packages[p].version, integrity: lock.packages[p].integrity, dev: lock.packages[p].dev === true })) });
}
async function inspect() {
  assert.equal(process.platform, "linux"); const context = await json(join(output, "context.json")); assert.equal(await git(["rev-parse", "HEAD"]), context.revision);
  assert.equal(sha(await readFile(join(web, "package-lock.json"))), expectedLock);
  // Reuse only physical inspection helpers. Do not invoke risk-acceptance functions or mutate policy.
  const { inventoryTree, inspectTraces } = await import(pathToFileURL(join(web, "scripts/security-control.mjs")));
  const lock = await json(join(web, "package-lock.json")); const hashes = new Set();
  async function reference(dir) { for (const d of await readdir(dir, { withFileTypes: true })) { if (d.name === "node_modules") continue; const p = join(dir, d.name); assert.ok(!d.isSymbolicLink()); if (d.isDirectory()) await reference(p); else if (/\.[cm]?js$/.test(d.name)) hashes.add(sha(await readFile(p))); } }
  for (const name of affected) await reference(join(web, "node_modules", name)); assert.ok(hashes.size > 0);
  const next = join(web, ".next"); const standalone = join(next, "standalone"); const options = { originalHashes: hashes, devRoots: [await realpath(join(web, "node_modules"))] };
  const inventory = await inventoryTree(standalone, options); const staticFiles = await inventoryTree(join(next, "static"), options); let entry;
  for (const c of [standalone, join(standalone, "apps/web")]) { try { if ((await lstat(join(c, "server.js"))).isFile()) { entry = c; break; } } catch (e) { if (e.code !== "ENOENT") throw e; } }
  assert.ok(entry); const buildId = (await readFile(join(next, "BUILD_ID"), "utf8")).trim(); assert.ok(buildId); assert.equal((await readFile(join(entry, ".next/BUILD_ID"), "utf8")).trim(), buildId);
  assert.deepEqual(await inventoryTree(join(entry, ".next/static"), options), staticFiles);
  const publicFiles = await inventoryTree(join(web, "public"), options); assert.deepEqual(await inventoryTree(join(entry, "public"), options), publicFiles);
  const traces = await inspectTraces(next, web, lock); const packages = [];
  for (const f of inventory) {
    if (!/(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+\/package\.json$/.test(f.path)) continue;
    const key = f.path.slice(f.path.indexOf("node_modules/")).replace(/\/package\.json$/, ""); const d = await json(join(standalone, f.path)); const p = lock.packages[key];
    assert.ok(p, `Unknown physical runtime package: ${key}`); assert.equal(d.version, p.version); const prefix = f.path.slice(0, -"package.json".length);
    const implementation = inventory.filter(x => x.path.startsWith(prefix) && x.path !== f.path && !x.path.slice(prefix.length).startsWith("node_modules/"));
    if (p.dev === true) assert.equal(implementation.length, 0, `Development implementation included: ${key}`);
    packages.push({ name: d.name, version: d.version, path: f.path, dev: p.dev === true, metadataOnly: implementation.length === 0 });
  }
  assert.ok(packages.some(p => p.name === "next")); const report = { diagnosticOnly: true, secAcceptance: false, context, buildId, lockSha256: expectedLock, checkedOutSha: context.revision, referenceSourceHashes: [...hashes].sort(), packages, standaloneInventory: inventory, staticInventory: staticFiles, publicInventory: publicFiles, traces, executableAffectedCodeDetected: false, detectionStatement: "No affected physical packages, original-source hashes, recognized code signatures or imports found within inspected trees/traces. Bounded detection is not proof against arbitrary transformation or obfuscation.", clerkIntegrated: false, futureAuthenticationArtifactCertified: false };
  await save("artifact-inventory.json", report); console.log(JSON.stringify({ checkedOutSha: context.revision, buildId, standaloneEntries: inventory.length, traces: traces.length, referenceHashes: hashes.size, packages: packages.length, executableAffectedCodeDetected: false, diagnosticOnly: true, secAcceptance: false }));
}
async function selfTest() {
  const reference = await json(join(web, "tests/fixtures/security-audit.json")); const report = structuredClone(reference); report.metadata.dependencies = { prod: 29, dev: 211, optional: 65, peer: 34, peerOptional: 0, total: 277 };
  const p = { code: 1, signal: null, timedOut: false, error: null, stderr: "", stdout: JSON.stringify(report) }; classifyAudit(p, reference);
  for (const change of [{ stdout: "{}" }, { stdout: "{" }, { error: "ENOTFOUND" }, { timedOut: true }, { code: 0 }]) assert.throws(() => classifyAudit({ ...p, ...change }, reference));
  const extra = structuredClone(report); extra.vulnerabilities.other = {}; assert.throws(() => classifyAudit({ ...p, stdout: JSON.stringify(extra) }, reference));
  const altered = structuredClone(report); altered.vulnerabilities.braces.severity = "critical"; assert.throws(() => classifyAudit({ ...p, stdout: JSON.stringify(altered) }, reference));
  assert.deepEqual(runtimeClosure({ "node_modules/a": { dependencies: { b: "1" } }, "node_modules/b": {} }, ["a"]), ["node_modules/a", "node_modules/b"]);
  const env = { GITHUB_EVENT_NAME: "pull_request", GITHUB_REPOSITORY: repo, GITHUB_HEAD_REF: branch, GITHUB_BASE_REF: baseBranch, GITHUB_REF: "refs/pull/15/merge", GITHUB_WORKFLOW_REF: `${repo}/.github/workflows/sec-gate-05-diagnostic.yml@refs/pull/15/merge`, GITHUB_SHA: "c".repeat(40) };
  const event = { repository: { full_name: repo }, number: 15, pull_request: { draft: true, head: { sha: "a".repeat(40), ref: branch, repo: { full_name: repo, fork: false } }, base: { sha: expectedBase, ref: baseBranch, repo: { full_name: repo } } } };
  validateIdentity(event, env, "a".repeat(40), [expectedBase], allowed.map(n => `A\t${n}`));
  for (const mutate of [e => { e.pull_request.head.repo.fork = true; }, e => { e.pull_request.base.sha = "b".repeat(40); }, e => { e.pull_request.base.ref = "main"; }, e => { e.pull_request.head.ref = "other"; }]) { const e = structuredClone(event); mutate(e); assert.throws(() => validateIdentity(e, env, "a".repeat(40), [expectedBase], allowed.map(n => `A\t${n}`))); }
  const require = createRequire(join(web, "package.json"));
  try { require.resolve("typescript"); } catch { console.log("PASS: pure diagnostic process, audit, closure and context negatives; physical helper self-tests require installed baseline."); return; }
  const { inventoryTree } = await import(pathToFileURL(join(web, "scripts/security-control.mjs"))); const dir = await mkdtemp(join(tmpdir(), "kevolint-sec05-tests-"));
  try {
    const bytes = Buffer.from("export const safe = true;"); await writeFile(join(dir, "safe.js"), bytes); await inventoryTree(dir);
    await assert.rejects(inventoryTree(dir, { originalHashes: new Set([sha(bytes)]) }));
    await writeFile(join(dir, "bad.js"), 'require("braces")'); await assert.rejects(inventoryTree(dir)); await rm(join(dir, "bad.js"));
    await writeFile(join(dir, "bad.js"), 'const message = "expanded array length exceeds range limit. Use options.rangeLimit";'); await assert.rejects(inventoryTree(dir)); await rm(join(dir, "bad.js"));
    await mkdir(join(dir, "nested/node_modules/braces"), { recursive: true }); await writeFile(join(dir, "nested/node_modules/braces/package.json"), '{"name":"braces"}'); await assert.rejects(inventoryTree(dir));
    const nested = resolve(dir, "nested"); assert.ok(nested.startsWith(resolve(dir) + "/") || nested.startsWith(resolve(dir) + "\\")); await rm(nested, { recursive: true, force: true });
    if (process.platform === "linux") {
      await symlink("/etc/hosts", join(dir, "outside")); await assert.rejects(inventoryTree(dir)); await rm(join(dir, "outside"));
      await symlink("missing", join(dir, "broken")); await assert.rejects(inventoryTree(dir)); await rm(join(dir, "broken"));
      await symlink(".", join(dir, "cycle")); await assert.rejects(inventoryTree(dir)); await rm(join(dir, "cycle"));
      await symlink("safe.js", join(dir, "internal")); assert.ok((await inventoryTree(dir)).some(f => f.path === "internal" && f.link === "safe.js"));
      await assert.rejects(inventoryTree(dir, { devRoots: [dir] }));
    }
  }
  finally { const rel = relative(tmpdir(), resolve(dir)); assert.ok(!isAbsolute(rel) && !rel.startsWith("..") && rel.startsWith("kevolint-sec05-tests-")); await rm(dir, { recursive: true, force: true }); }
  console.log("PASS: diagnostic negatives and real physical helper rejection; no acceptance evaluated.");
}
async function finalize() {
  const required = ["npm-ci", "lint", "unit", "design-browser", "public-browser", "ui-browser", "modal-browser", "secrets", "typecheck", "boundary", "build", "smoke", "pages"];
  const rows = []; for (const id of required) { try { const p = await json(join(output, `${id}.process.json`)); rows.push({ id, code: p.code, error: p.error, timedOut: p.timedOut, passed: p.code === 0 && !p.error && !p.timedOut && !p.signal }); } catch (e) { if (e.code !== "ENOENT") throw e; rows.push({ id, passed: false, omitted: true }); } }
  const checks = {}; for (const name of ["context.json", "installed-validation.json", "audit-classification.json", "artifact-inventory.json"]) { try { await json(join(output, name)); checks[name] = true; } catch { checks[name] = false; } }
  const complete = rows.every(r => r.passed) && Object.values(checks).every(Boolean);
  await save("summary.json", { diagnosticOnly: true, secAcceptance: false, complete, rows, checks, noClerkIntegration: true, expiresOriginalUnchanged: "2026-11-01T04:59:00Z", generatedAt: new Date().toISOString() });
  const files = {}; for (const name of (await readdir(output)).sort()) { if (name === "manifest.json") continue; assert.ok((await lstat(join(output, name))).isFile()); const bytes = await readFile(join(output, name)); files[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  await save("manifest.json", { algorithm: "SHA-256", diagnosticOnly: true, secAcceptance: false, files });
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## SEC-GATE-05 diagnostic evidence\n\nCollection complete: ${complete}. **No SEC acceptance.**\n\n${rows.map(r => `- ${r.id}: ${r.passed ? "PASS" : r.omitted ? "OMITTED" : "FAIL"}`).join("\n")}\n\nOriginal advisory remains. SDK is not integrated; no future authentication artifact is certified.\n`);
  console.log(JSON.stringify({ complete, diagnosticOnly: true, secAcceptance: false })); return complete;
}
const [mode, ...args] = process.argv.slice(2);
try {
  if (mode === "preflight") await preflight();
  else if (mode === "installed") await installed();
  else if (mode === "audit") await audit();
  else if (mode === "inspect") await inspect();
  else if (mode === "self-test") await selfTest();
  else if (mode === "run") { const [id, command, ...argv] = args; assert.ok(["npm", "node"].includes(command)); processOkay(await captured(id, command, argv, { cwd: id === "secrets" ? repository : web, timeout: id === "pages" ? 240000 : 150000 })); }
  else if (mode === "finalize") { if (!await finalize()) process.exitCode = 1; }
  else throw new Error("Unknown diagnostic command");
} catch (e) { if (mode !== "self-test") await save(`${mode}-error.json`, { diagnosticOnly: true, secAcceptance: false, error: e.message }); console.error(e.stack); process.exitCode = 1; }
