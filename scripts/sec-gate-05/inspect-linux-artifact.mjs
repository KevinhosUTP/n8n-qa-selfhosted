// Diagnostic evidence only. Never grants, replaces or exports SEC acceptance.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, readdir, lstat, realpath, mkdtemp, rm, rmdir, unlink, symlink } from "node:fs/promises";
import { dirname, join, resolve, relative, isAbsolute, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir, release, arch } from "node:os";
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const web = join(repository, "apps/web");
const output = join(repository, ".tools/sec-gate-05-evidence");
const expectedBase = "d559c4215ee8297baaf9f8a991c6a0e15a4fdb6f";
const expectedFirst = "00a8a9989d0bb2aa5973f684d786b4b236c0ff74";
const correctiveSubject = "fix(sec): isolate npm configs in diagnostic preflight";
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
const ownedConfigDirectories = new Set();
const maxOutputBytes = 2 * 1024 * 1024;
function assertOwnedConfigPaths(config) {
  const dir = resolve(config.dir);
  assert.ok(ownedConfigDirectories.has(dir), "Unowned configuration directory");
  assert.equal(dirname(dir), config.parent);
  assert.match(basename(dir), /^kevolint-sec05-npm-[a-zA-Z0-9]+$/);
  assert.equal(config.user, join(dir, "user.npmrc"));
  assert.equal(config.global, join(dir, "global.npmrc"));
  assert.notEqual(config.user, config.global);
}
async function validateConfigFiles(config) {
  assertOwnedConfigPaths(config);
  assert.ok((await lstat(config.dir)).isDirectory());
  assert.ok(!(await lstat(config.dir)).isSymbolicLink());
  assert.equal(await realpath(config.dir), config.dir);
  const stats = [];
  for (const p of [config.user, config.global]) {
    const stat = await lstat(p); stats.push(stat);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), "Configuration must be a regular file");
    assert.equal(stat.size, 0, "Configuration must remain empty");
    assert.equal(stat.nlink, 1, "Configuration must not be hard-linked");
    assert.equal(await realpath(p), p);
    if (process.platform !== "win32") assert.equal(stat.mode & 0o777, 0o600);
  }
  assert.notEqual(stats[0].ino, stats[1].ino, "Configurations must be distinct physical files");
}
async function cleanupConfigFiles(config) {
  assertOwnedConfigPaths(config);
  assert.ok(!(await lstat(config.dir)).isSymbolicLink());
  assert.equal(await realpath(config.dir), config.dir);
  // Remove only the two owned names; never recursively remove an arbitrary tree.
  for (const p of [config.user, config.global]) {
    try { await unlink(p); } catch (e) { if (e.code !== "ENOENT") throw e; }
  }
  await rmdir(config.dir); ownedConfigDirectories.delete(config.dir);
}
async function createConfigFiles() {
  const parent = await realpath(tmpdir());
  const dir = await mkdtemp(join(parent, "kevolint-sec05-npm-"));
  const config = { parent, dir, user: join(dir, "user.npmrc"), global: join(dir, "global.npmrc") };
  ownedConfigDirectories.add(dir);
  try {
    for (const p of [config.user, config.global]) await writeFile(p, "", { flag: "wx", mode: 0o600 });
    await validateConfigFiles(config); return config;
  } catch (e) { await cleanupConfigFiles(config); throw e; }
}
function cleanEnvironment(config, source = process.env) {
  assertOwnedConfigPaths(config);
  return { ...Object.fromEntries(Object.entries(source).filter(([k]) => /^(path|systemroot|windir|home|userprofile|temp|tmp|comspec|pathext|lang|lc_all|tz)$/i.test(k))), NEXT_TELEMETRY_DISABLED: "1", NPM_CONFIG_REGISTRY: "https://registry.npmjs.org", NPM_CONFIG_STRICT_SSL: "true", NPM_CONFIG_USERCONFIG: config.user, NPM_CONFIG_GLOBALCONFIG: config.global };
}
async function processRun(command, args, { cwd = web, timeout = 120000 } = {}) {
  const result = { command, args, startedAt: new Date().toISOString(), finishedAt: null, code: null, signal: null, error: null, timedOut: false, truncated: false, stdout: "", stderr: "", maxOutputBytesPerStream: maxOutputBytes, npmConfig: null, cleanupError: null };
  let config;
  try {
    config = await createConfigFiles();
    result.npmConfig = { directory: config.dir, user: config.user, global: config.global, distinctEmptyFiles: true, cleaned: false };
    await new Promise(done => {
      const child = spawn(command, args, { cwd, env: cleanEnvironment(config), shell: false, windowsHide: true, detached: process.platform !== "win32" });
      const chunks = { stdout: [], stderr: [] }; const lengths = { stdout: 0, stderr: 0 };
      const kill = () => { try { if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL"); else child.kill("SIGKILL"); } catch (e) { if (e.code !== "ESRCH") result.error = e.message; } };
      const collect = (name, bytes) => {
        const available = maxOutputBytes - lengths[name];
        if (available > 0) { const part = bytes.subarray(0, available); chunks[name].push(part); lengths[name] += part.length; }
        if (bytes.length > available) { result.truncated = true; result.error = "Subprocess output limit exceeded"; kill(); }
      };
      const timer = setTimeout(() => { result.timedOut = true; kill(); }, timeout);
      child.stdout.on("data", bytes => collect("stdout", bytes)); child.stderr.on("data", bytes => collect("stderr", bytes));
      child.once("error", e => { result.error = e.message; });
      child.once("close", (code, signal) => {
        clearTimeout(timer); result.code = code; result.signal = signal;
        result.stdout = Buffer.concat(chunks.stdout).toString("utf8"); result.stderr = Buffer.concat(chunks.stderr).toString("utf8"); done();
      });
    });
    await validateConfigFiles(config);
  } catch (e) { result.error = result.error ? result.error + "; " + e.message : e.message; }
  finally {
    if (config) {
      try { await cleanupConfigFiles(config); result.npmConfig.cleaned = true; }
      catch (e) { result.cleanupError = e.message; result.error = "Configuration cleanup failed: " + e.message; }
    }
    result.finishedAt = new Date().toISOString();
  }
  return result;
}
async function git(args) { const r = await processRun("git", args, { cwd: repository }); processOkay(r); return r.stdout.trim(); }
function processOkay(p, codes = [0]) { assert.ok(!p.error && !p.timedOut && !p.signal && !p.truncated && !p.cleanupError, "Process/network/timeout/output/cleanup failure"); assert.ok(codes.includes(p.code), `Unexpected process exit ${p.code}`); }
async function captured(id, command, args, options) {
  assert.match(id, /^[a-z0-9-]+$/); const p = await processRun(command, args, options);
  if (id === "npm-version") p.versionObtained = /^\d+\.\d+\.\d+$/.test(p.stdout.trim()) ? p.stdout.trim() : null;
  await save(`${id}.process.json`, p); console.log(p.stdout); if (p.stderr) console.error(p.stderr); return p;
}
function validateIdentity(event, environment, checkedOut, parents, names) {
  const pr = event.pull_request;
  assert.equal(environment.GITHUB_EVENT_NAME, "pull_request"); assert.equal(environment.GITHUB_REPOSITORY, repo);
  assert.equal(event.repository.full_name, repo); assert.equal(pr.head.repo.full_name, repo); assert.equal(pr.base.repo.full_name, repo); assert.equal(pr.head.repo.fork, false);
  assert.equal(pr.draft, true); assert.equal(pr.head.ref, branch); assert.equal(pr.base.ref, baseBranch); assert.equal(pr.base.sha, expectedBase);
  assert.match(pr.head.sha, /^[a-f0-9]{40}$/); assert.equal(checkedOut, pr.head.sha); assert.deepEqual(parents, [expectedFirst]);
  assert.equal(environment.GITHUB_HEAD_REF, branch); assert.equal(environment.GITHUB_BASE_REF, baseBranch);
  assert.equal(environment.GITHUB_REF, `refs/pull/${event.number}/merge`);
  assert.equal(environment.GITHUB_WORKFLOW_REF, `${repo}/.github/workflows/sec-gate-05-diagnostic.yml@${environment.GITHUB_REF}`);
  assert.match(environment.GITHUB_SHA, /^[a-f0-9]{40}$/); assert.deepEqual(names.sort(), allowed.map(n => `A\t${n}`).sort());
}
function validateHistory(checkedOut, history) {
  assert.deepEqual(history.commits, [expectedFirst, checkedOut], "Exactly the approved first commit and one corrective commit required");
  assert.notEqual(checkedOut, expectedFirst);
  assert.deepEqual(history.firstParents, [expectedBase], "First commit must have only the approved base as parent");
  assert.deepEqual(history.headParents, [expectedFirst], "Corrective commit must have only the approved first commit as parent");
  assert.equal(history.headSubject, correctiveSubject);
  assert.deepEqual([...history.firstNames].sort(), allowed.map(n => "A\t" + n).sort());
  assert.deepEqual(history.correctiveNames, ["M\tscripts/sec-gate-05/inspect-linux-artifact.mjs"]);
}
async function preflight() {
  assert.equal(process.platform, "linux", "Linux diagnostic required");
  const event = await json(process.env.GITHUB_EVENT_PATH); const revision = await git(["rev-parse", "HEAD"]);
  const context = { diagnosticOnly: true, secAcceptance: false, preflightComplete: false, revision, eventMergeRevision: process.env.GITHUB_SHA, eventRef: process.env.GITHUB_REF, workflowRef: process.env.GITHUB_WORKFLOW_REF, head: event.pull_request.head.sha, base: expectedBase, pr: event.number, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT, node: process.version, os: process.platform, kernel: release(), arch: arch(), inspectedAt: new Date().toISOString() };
  await save("context.json", context);
  const parents = (await git(["show", "-s", "--format=%P", "HEAD"])).split(" ");
  const names = (await git(["diff", "--name-status", expectedBase + "..HEAD"])).split("\n");
  validateIdentity(event, process.env, revision, parents, names);
  const history = { commits: (await git(["rev-list", "--reverse", expectedBase + "..HEAD"])).split("\n"), firstParents: (await git(["show", "-s", "--format=%P", expectedFirst])).split(" "), headParents: parents, headSubject: await git(["show", "-s", "--format=%s", "HEAD"]), firstNames: (await git(["diff", "--name-status", expectedBase, expectedFirst])).split("\n"), correctiveNames: (await git(["diff", "--name-status", expectedFirst, "HEAD"])).split("\n") };
  await save("history.json", history); validateHistory(revision, history);
  assert.equal(await git(["rev-list", "--count", expectedBase + "..HEAD"]), "2");
  const lock = await readFile(join(web, "package-lock.json")); assert.equal(sha(lock), expectedLock);
  for (const p of ["apps/web/package.json", "apps/web/package-lock.json", ".github/security/sec-pr01-01.json", "apps/web/scripts/security-control.mjs", ".github/workflows/frontend-checks.yml", "docs/security-backlog.md"]) {
    const actual = await readFile(join(repository, p)); const committed = await processRun("git", ["show", expectedBase + ":" + p], { cwd: repository });
    processOkay(committed); assert.equal(sha(actual), sha(Buffer.from(committed.stdout)), "Protected file differs: " + p);
  }
  const npm = await captured("npm-version", "npm", ["--version"]);
  context.npm = npm.versionObtained; context.lockSha256 = sha(lock); await save("context.json", context);
  processOkay(npm); assert.equal(npm.versionObtained, "10.9.3"); assert.equal(process.version, "v22.20.0");
  context.preflightComplete = true; await save("context.json", context); console.log(JSON.stringify(context));
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
async function processAndConfigTests() {
  const config = await createConfigFiles(); let configNegatives = 0;
  try {
    await validateConfigFiles(config);
    for (const bad of [{ ...config, global: config.user }, { ...config, user: join(config.parent, "external.npmrc") }, { ...config, dir: config.parent }]) {
      await assert.rejects(validateConfigFiles(bad)); configNegatives++;
    }
    await assert.rejects(cleanupConfigFiles({ ...config, dir: config.parent })); configNegatives++;
    await writeFile(config.user, "fixture=true\n"); await assert.rejects(validateConfigFiles(config)); configNegatives++; await writeFile(config.user, "");
    if (process.platform === "linux") {
      await unlink(config.user); await symlink(config.global, config.user);
      await assert.rejects(validateConfigFiles(config)); configNegatives++;
      await unlink(config.user); await writeFile(config.user, "", { flag: "wx", mode: 0o600 });
    }
    const env = cleanEnvironment(config, { PATH: process.env.PATH ?? "", NPM_CONFIG_REGISTRY: "https://unapproved.invalid", NPM_CONFIG_STRICT_SSL: "false", NPM_CONFIG_USERCONFIG: "external", NPM_CONFIG_GLOBALCONFIG: "external", NODE_OPTIONS: "--require unapproved", NODE_TLS_REJECT_UNAUTHORIZED: "0", FAKE_SECRET: "synthetic-fixture" });
    assert.equal(env.NPM_CONFIG_REGISTRY, "https://registry.npmjs.org"); assert.equal(env.NPM_CONFIG_STRICT_SSL, "true");
    assert.equal(env.NPM_CONFIG_USERCONFIG, config.user); assert.equal(env.NPM_CONFIG_GLOBALCONFIG, config.global);
    for (const key of ["NODE_OPTIONS", "NODE_TLS_REJECT_UNAUTHORIZED", "FAKE_SECRET"]) assert.ok(!Object.hasOwn(env, key));
  } finally { await cleanupConfigFiles(config); }
  await assert.rejects(lstat(config.dir), { code: "ENOENT" });
  const rows = [];
  const retain = async (name, result) => {
    assert.ok(result.npmConfig.distinctEmptyFiles && result.npmConfig.cleaned && !result.cleanupError);
    await assert.rejects(lstat(result.npmConfig.directory), { code: "ENOENT" });
    assert.ok(result.startedAt && result.finishedAt);
    rows.push({ name, ...result, stdout: result.truncated ? "[bounded output-limit fixture, deliberately rejected]" : result.stdout });
  };
  const npmCommand = process.platform === "win32" ? process.execPath : "npm";
  const npmArgs = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"), "--version"] : ["--version"];
  const npm = await processRun(npmCommand, npmArgs); await retain("real-npm-version", npm); processOkay(npm); assert.equal(npm.stdout.trim(), "10.9.3");
  const failure = await captured("self-test-failure", process.execPath, ["-e", "process.stdout.write('fixture-stdout');process.stderr.write('fixture-stderr');process.exitCode=7"]);
  assert.deepEqual(await json(join(output, "self-test-failure.process.json")), failure);
  await retain("nonzero-with-both-streams", failure); assert.equal(failure.code, 7); assert.equal(failure.stdout, "fixture-stdout"); assert.equal(failure.stderr, "fixture-stderr"); assert.throws(() => processOkay(failure));
  const missing = await processRun("__kevolint_missing_executable__", []); await retain("spawn-error", missing); assert.match(missing.error, /ENOENT/); assert.throws(() => processOkay(missing));
  const timeout = await processRun(process.execPath, ["-e", "setInterval(()=>{},1000)"], { timeout: 100 }); await retain("timeout", timeout); assert.equal(timeout.timedOut, true); assert.throws(() => processOkay(timeout));
  const signal = await processRun(process.execPath, ["-e", "process.kill(process.pid,'SIGTERM')"]); await retain("signal-or-platform-nonzero", signal); assert.ok(signal.signal || signal.code !== 0); assert.throws(() => processOkay(signal));
  const overflow = await processRun(process.execPath, ["-e", "process.stdout.write(Buffer.alloc(3*1024*1024,97))"]); await retain("output-limit", overflow); assert.equal(overflow.truncated, true); assert.ok(Buffer.byteLength(overflow.stdout) <= maxOutputBytes); assert.throws(() => processOkay(overflow));
  assert.equal(ownedConfigDirectories.size, 0);
  await save("self-test-processes.json", { fixtureOnly: true, platform: process.platform, configNegatives, configurationContentsRecorded: false, rows });
}
async function selfTest() {
  await processAndConfigTests();
  const reference = await json(join(web, "tests/fixtures/security-audit.json")); const report = structuredClone(reference); report.metadata.dependencies = { prod: 29, dev: 211, optional: 65, peer: 34, peerOptional: 0, total: 277 };
  const p = { code: 1, signal: null, timedOut: false, error: null, stderr: "", stdout: JSON.stringify(report) }; classifyAudit(p, reference);
  for (const change of [{ stdout: "{}" }, { stdout: "{" }, { error: "ENOTFOUND" }, { timedOut: true }, { code: 0 }]) assert.throws(() => classifyAudit({ ...p, ...change }, reference));
  const extra = structuredClone(report); extra.vulnerabilities.other = {}; assert.throws(() => classifyAudit({ ...p, stdout: JSON.stringify(extra) }, reference));
  const altered = structuredClone(report); altered.vulnerabilities.braces.severity = "critical"; assert.throws(() => classifyAudit({ ...p, stdout: JSON.stringify(altered) }, reference));
  assert.deepEqual(runtimeClosure({ "node_modules/a": { dependencies: { b: "1" } }, "node_modules/b": {} }, ["a"]), ["node_modules/a", "node_modules/b"]);
  const env = { GITHUB_EVENT_NAME: "pull_request", GITHUB_REPOSITORY: repo, GITHUB_HEAD_REF: branch, GITHUB_BASE_REF: baseBranch, GITHUB_REF: "refs/pull/15/merge", GITHUB_WORKFLOW_REF: `${repo}/.github/workflows/sec-gate-05-diagnostic.yml@refs/pull/15/merge`, GITHUB_SHA: "c".repeat(40) };
  const event = { repository: { full_name: repo }, number: 15, pull_request: { draft: true, head: { sha: "a".repeat(40), ref: branch, repo: { full_name: repo, fork: false } }, base: { sha: expectedBase, ref: baseBranch, repo: { full_name: repo } } } };
  validateIdentity(event, env, "a".repeat(40), [expectedFirst], allowed.map(n => `A\t${n}`));
  for (const mutate of [e => { e.pull_request.head.repo.fork = true; }, e => { e.pull_request.base.sha = "b".repeat(40); }, e => { e.pull_request.base.ref = "main"; }, e => { e.pull_request.head.ref = "other"; }]) { const e = structuredClone(event); mutate(e); assert.throws(() => validateIdentity(e, env, "a".repeat(40), [expectedFirst], allowed.map(n => `A\t${n}`))); }
  const goodHistory = { commits: [expectedFirst, "a".repeat(40)], firstParents: [expectedBase], headParents: [expectedFirst], headSubject: correctiveSubject, firstNames: allowed.map(n => "A\t" + n), correctiveNames: ["M\tscripts/sec-gate-05/inspect-linux-artifact.mjs"] };
  validateHistory("a".repeat(40), goodHistory);
  const historyNegatives = [h => { h.commits.pop(); }, h => { h.commits.push("b".repeat(40)); }, h => { h.commits[0] = "b".repeat(40); }, h => { h.commits[1] = "b".repeat(40); }, h => { h.firstParents = ["b".repeat(40)]; }, h => { h.firstParents.push("b".repeat(40)); }, h => { h.headParents = [expectedBase]; }, h => { h.headParents.push("b".repeat(40)); }, h => { h.headSubject = "unauthorized"; }, h => { h.firstNames.pop(); }, h => { h.correctiveNames.push("M\tapps/web/package.json"); }];
  for (const mutate of historyNegatives) { const h = structuredClone(goodHistory); mutate(h); assert.throws(() => validateHistory("a".repeat(40), h)); }
  for (const key of ["GITHUB_EVENT_NAME", "GITHUB_REPOSITORY", "GITHUB_HEAD_REF", "GITHUB_BASE_REF", "GITHUB_REF", "GITHUB_WORKFLOW_REF", "GITHUB_SHA"]) assert.throws(() => validateIdentity(event, { ...env, [key]: "unauthorized" }, "a".repeat(40), [expectedFirst], allowed.map(n => "A\t" + n)));
  assert.throws(() => validateIdentity(event, env, "b".repeat(40), [expectedFirst], allowed.map(n => "A\t" + n)));
  assert.throws(() => validateIdentity(event, env, "a".repeat(40), [expectedFirst], [...allowed.map(n => "A\t" + n), "M\tapps/web/package.json"]));
  await save("self-test-history.json", { fixtureOnly: true, actualGitHubEnvironmentModified: false, positive: "exact approved two-commit chain", rejectedHistories: historyNegatives.length, rejectedAdditionalContexts: 9 });
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
  const required = ["npm-version", "npm-ci", "lint", "unit", "design-browser", "public-browser", "ui-browser", "modal-browser", "secrets", "typecheck", "boundary", "build", "smoke", "pages"];
  const rows = []; for (const id of required) { try { const p = await json(join(output, `${id}.process.json`)); rows.push({ id, code: p.code, error: p.error, timedOut: p.timedOut, passed: p.code === 0 && !p.error && !p.timedOut && !p.signal }); } catch (e) { if (e.code !== "ENOENT") throw e; rows.push({ id, passed: false, omitted: true }); } }
  const checks = {}; for (const name of ["context.json", "installed-validation.json", "audit-classification.json", "artifact-inventory.json"]) { try { const data = await json(join(output, name)); checks[name] = name === "context.json" ? data.preflightComplete === true : true; } catch { checks[name] = false; } }
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
