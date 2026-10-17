import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFile, lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { arch, release } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = resolve(web, "../..");
const names = ["@next/eslint-plugin-next", "fast-glob", "micromatch", "braces"];
const versions = ["16.4.2", "3.3.1", "4.0.8", "3.0.3"];
const severities = ["info", "low", "moderate", "high", "critical"];
const hash = (data) => createHash("sha256").update(data).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const inside = (root, path) => path === root || (!isAbsolute(relative(root, path)) && !relative(root, path).split(sep).includes(".."));
const slash = (path) => path.split(sep).join("/");
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const same = (a, b) => assert.deepEqual(a, b);

export function validatePolicy(policy) {
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.id, "SEC-PR01-01");
  assert.equal(policy.status, "temporarily-accepted-not-fixed");
  assert.equal(policy.owner, "KevinhosUTP");
  assert.equal(policy.repository, "KevinhosUTP/n8n-qa-selfhosted");
  assert.equal(policy.pullRequest, 4);
  assert.equal(policy.branch, "codex/kevolint-pr01-foundation");
  assert.equal(policy.baseBranch, "develop");
  assert.equal(policy.advisory, "GHSA-vfj7-8cjw-p6xm");
  assert.equal(policy.cve, "CVE-2026-93687");
  assert.equal(policy.severity, "high");
  same(policy.chain, names.map((name, i) => ({ name, version: versions[i] })));
  assert.equal(policy.lockfileSha256, "aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5");
  assert.equal(policy.expiresAt, "2026-11-01T04:59:00Z");
  assert.equal(policy.expiresLocal, "2026-10-31T23:59:00-05:00");
  assert.equal(policy.timezone, "America/Lima");
  same(policy.reviewDates, ["2026-10-24", "2026-10-31"]);
  assert.equal(policy.automaticRenewal, false);
  assert.equal(policy.productionCodeAllowed, false);
}

// No clock override is read by the CLI. Tests inject time into this pure evaluator only.
export function evaluateAuthorization(policy, context, now) {
  validatePolicy(policy);
  assert.ok(Number.isFinite(now.getTime()), "Invalid clock");
  assert.ok(now.getTime() < Date.parse(policy.expiresAt), "SEC-PR01-01 expired");
  assert.equal(context.repository, policy.repository, "Unauthorized repository");
  assert.equal(context.branch, policy.branch, "Unauthorized branch");
  assert.match(context.revision, /^[a-f0-9]{40}$/);
  if (context.github) {
    assert.equal(context.os, "linux", "Linux verification required");
    assert.equal(context.checkedOutRevision, context.revision, "Checkout revision mismatch");
    if (context.event === "pull_request") {
      assert.equal(context.pullRequest, policy.pullRequest, "Unauthorized PR");
      assert.equal(context.headRepository, policy.repository, "Fork PR is not authorized");
      assert.equal(context.baseBranch, policy.baseBranch);
    } else {
      assert.equal(context.event, "push", "Unauthorized event");
      assert.equal(context.ref, `refs/heads/${policy.branch}`);
    }
  } else {
    assert.equal(context.event, "local");
  }
}

export function evaluateAudit(processResult, policy) {
  assert.ok(!processResult.error && !processResult.timedOut && !processResult.signal, "Audit process failed or timed out");
  assert.ok([0, 1].includes(processResult.code), "Unexpected audit exit code");
  assert.equal(processResult.stderr.trim(), "", "Audit stderr requires investigation");
  const report = JSON.parse(processResult.stdout);
  assert.equal(report.auditReportVersion, 2, "Audit report v2 required");
  assert.ok(!report.error && object(report.vulnerabilities) && object(report.metadata), "Incomplete audit");
  const counts = report.metadata.vulnerabilities;
  const dependencies = report.metadata.dependencies;
  assert.ok(object(counts) && object(dependencies), "Missing audit counters");
  for (const key of [...severities, "total"]) assert.ok(integer(counts[key]), `Invalid ${key} count`);
  for (const key of ["prod", "dev", "optional", "peer", "peerOptional", "total"]) {
    assert.ok(integer(dependencies[key]), `Invalid dependency counter ${key}`);
    assert.ok(dependencies[key] <= dependencies.total, `Incoherent dependency counter ${key}`);
  }
  assert.ok(dependencies.total > 0 && dependencies.total >= dependencies.prod && dependencies.total >= dependencies.dev);
  const entries = Object.entries(report.vulnerabilities);
  assert.equal(counts.total, entries.length, "Vulnerability count mismatch");
  assert.equal(severities.reduce((n, s) => n + counts[s], 0), counts.total);
  for (const severity of severities) {
    assert.equal(entries.filter(([, node]) => node.severity === severity).length, counts[severity]);
  }
  assert.equal(processResult.code, entries.length === 0 ? 0 : 1, "Audit exit/report mismatch");
  if (!entries.length) return { status: "sin hallazgos", report };
  same(entries.map(([name]) => name).sort(), [...names].sort());
  const roots = new Set();
  const visit = (name, stack = []) => {
    assert.ok(!stack.includes(name), "Cyclic audit via graph");
    const index = names.indexOf(name);
    assert.ok(index >= 0, "Unknown audit node");
    const node = report.vulnerabilities[name];
    assert.ok(object(node), "Missing audit node");
    assert.equal(node.name, name);
    assert.equal(node.severity, policy.severity, "Severity changed");
    assert.equal(node.isDirect, index === 0);
    assert.ok(typeof node.range === "string" && node.range.length > 0);
    same(node.nodes, [`node_modules/${name}`]);
    same(node.effects, index === 0 ? [] : [names[index - 1]]);
    assert.ok(Array.isArray(node.via) && node.via.length === 1, "Unexpected via relationship");
    // The audited fix is a forced major downgrade, not an approved compatible correction.
    same(node.fixAvailable, { name: names[0], version: "14.2.35", isSemVerMajor: true });
    for (const via of node.via) {
      if (typeof via === "string") {
        assert.equal(via, names[index + 1], "Unexpected dependency edge");
        visit(via, [...stack, name]);
      } else {
        assert.equal(index, names.length - 1);
        assert.ok(object(via) && integer(via.source) && typeof via.title === "string" && via.title.length > 0);
        assert.equal(via.name, "braces");
        assert.equal(via.dependency, "braces");
        assert.equal(via.url, `https://github.com/advisories/${policy.advisory}`, "Unexpected advisory");
        assert.equal(via.severity, policy.severity);
        assert.equal(via.range, "<=3.0.3");
        same(via.cwe, ["CWE-674"]);
        assert.equal(via.cvss?.score, 7.5);
        assert.equal(via.cvss?.vectorString, "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H");
        if (via.cves) same(via.cves, [policy.cve]);
        roots.add(via.url);
      }
    }
  };
  for (const [name] of entries) visit(name);
  assert.equal(roots.size, 1);
  return { status: "temporarily-accepted-not-fixed", report };
}

export function evaluateGraph(policy, { lockHash, lock, manifest, installed }) {
  assert.equal(lockHash, policy.lockfileSha256, "Lockfile hash changed");
  assert.equal(lock.lockfileVersion, 3);
  same(manifest.dependencies, lock.packages[""].dependencies);
  same(manifest.devDependencies, lock.packages[""].devDependencies);
  assert.equal(manifest.devDependencies[names[0]], versions[0]);
  for (const [index, name] of names.entries()) {
    assert.ok(!Object.hasOwn(manifest.dependencies, name), "Affected runtime dependency");
    const matches = Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`));
    assert.equal(matches.length, 1, `Unexpected copy of ${name}`);
    const [path, entry] = matches[0];
    assert.equal(path, `node_modules/${name}`);
    assert.equal(entry.version, versions[index]);
    assert.equal(entry.dev, true, "Dependency is not exclusively dev");
    assert.equal(installed[index].name, name);
    assert.equal(installed[index].version, entry.version);
    assert.equal(installed[index].path, path, "Resolved chain differs from lockfile");
    same(installed[index].dependencies, entry.dependencies);
    if (index < names.length - 1) {
      assert.ok(Object.hasOwn(entry.dependencies, names[index + 1]), "Missing chain edge");
    }
  }
}

export async function readGraph(policy) {
  const lockBytes = await readFile(join(web, "package-lock.json"));
  const lock = JSON.parse(lockBytes);
  const manifest = await json(join(web, "package.json"));
  const installed = [];
  let parent = join(web, "package.json");
  for (const name of names) {
    const path = createRequire(parent).resolve(`${name}/package.json`);
    const actual = await realpath(path);
    assert.ok(inside(join(web, "node_modules"), actual), "Dependency resolves outside installed tree");
    const pkg = await json(actual);
    installed.push({ ...pkg, path: slash(relative(web, dirname(actual))) });
    parent = actual;
  }
  const graph = { lockHash: hash(lockBytes), lock, manifest, installed };
  evaluateGraph(policy, graph);
  return graph;
}

export function evaluateEslint(config, requiredRules = {}) {
  assert.ok(config && object(config.rules), "Missing effective ESLint config");
  assert.ok(!Object.hasOwn(config.settings?.next ?? {}, "rootDir"), "settings.next.rootDir activates the vulnerable glob path");
  for (const [rule, value] of Object.entries(requiredRules)) {
    const expected = Array.isArray(value) ? value[0] : value;
    const enabled = (v) => ![0, "off", undefined].includes(v);
    if (enabled(expected)) {
      const actual = config.rules[rule];
      assert.ok(enabled(Array.isArray(actual) ? actual[0] : actual), `Required rule disabled: ${rule}`);
    }
  }
}

export async function inspectExposure(policy) {
  const graph = await readGraph(policy);
  const [{ ESLint }, next, hooks, typescript] = await Promise.all([
    import("eslint"), import("@next/eslint-plugin-next"), import("eslint-plugin-react-hooks"), import("typescript-eslint"),
  ]);
  const lint = new ESLint({ cwd: web });
  const files = await lint.lintFiles(["."]);
  assert.ok(files.length > 0, "No linted files");
  const required = {
    ...next.default.configs.recommended.rules, ...next.default.configs["core-web-vitals"].rules,
    ...hooks.default.configs.recommended.rules,
    ...Object.assign({}, ...typescript.default.configs.recommended.map((config) => config.rules)),
  };
  const configs = [];
  for (const file of files) {
    const config = await lint.calculateConfigForFile(file.filePath);
    const typed = /\.tsx?$/.test(file.filePath);
    evaluateEslint(config, typed ? required : {});
    assert.equal(file.errorCount + file.warningCount, 0, "Lint must remain clean");
    configs.push({ file: slash(relative(web, file.filePath)), rulesSha256: hash(JSON.stringify(config.rules)), nextRootDir: "absent" });
  }
  return { lockHash: graph.lockHash, installed: graph.installed.map(({ name, version, path }) => ({ name, version, path })), configs };
}

// Uses the TypeScript lexer to ignore comments and decode literal escapes. Broad word
// searches would incorrectly flag Next's independent picomatch/CSRF implementation.
export function inspectCode(source, path, originalHashes = new Set()) {
  assert.ok(!originalHashes.has(hash(source)), `Original affected source in ${path}`);
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source.toString());
  let previous = "";
  let beforePrevious = "";
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    const text = scanner.getTokenValue() || scanner.getTokenText();
    if ([ts.SyntaxKind.StringLiteral, ts.SyntaxKind.NoSubstitutionTemplateLiteral].includes(token)) {
      assert.ok(!text.includes("expanded array length exceeds range limit. Use options.rangeLimit"), `Vulnerable expand signature in ${path}`);
      assert.notEqual(text, "node.isClose", `Vulnerable compile signature in ${path}`);
      const affected = names.some((name) => text === name || text.startsWith(`${name}/`) || text.includes(`/node_modules/${name}/`));
      if (affected && (previous === "from" || previous === "import" || (previous === "(" && ["require", "import", "resolve"].includes(beforePrevious)))) {
        assert.fail(`Affected import in ${path}: ${text}`);
      }
    }
    beforePrevious = previous;
    previous = scanner.getTokenText();
  }
}

// Each root is a physical boundary: following a runtime symlink outside it is forbidden.
export async function inventoryTree(root, { originalHashes = new Set(), devRoots = [] } = {}) {
  const boundary = await realpath(root);
  assert.ok((await lstat(root)).isDirectory(), `Required directory missing: ${root}`);
  const inventory = [];
  const visit = async (path, ancestors) => {
    const stat = await lstat(path);
    const actual = await realpath(path); // dangling links fail closed
    assert.ok(inside(boundary, actual), `External symlink: ${path}`);
    assert.ok(!devRoots.some((dev) => inside(dev, actual)), `Development symlink: ${path}`);
    assert.ok(!ancestors.has(actual), `Symlink cycle: ${path}`);
    const logical = slash(relative(root, path));
    if (stat.isSymbolicLink()) inventory.push({ path: logical, link: slash(relative(boundary, actual)) });
    const physical = stat.isSymbolicLink() ? await lstat(actual) : stat;
    if (physical.isDirectory()) {
      const next = new Set([...ancestors, actual]);
      for (const name of (await readdir(path)).sort()) await visit(join(path, name), next);
    } else {
      assert.ok(physical.isFile(), `Unsupported artifact entry: ${path}`);
      const bytes = await readFile(path);
      if (path.endsWith("package.json")) {
        const pkg = JSON.parse(bytes);
        assert.ok(!names.includes(pkg.name), `Affected physical package: ${logical}`);
      }
      assert.ok(!names.some((name) => `/${logical}/`.includes(`/node_modules/${name}/`)), `Affected nested package path: ${logical}`);
      assert.ok(!originalHashes.has(hash(bytes)), `Affected source hash: ${logical}`);
      if (/\.(?:[cm]?js|jsx|ts|tsx|html|css)$/.test(path)) inspectCode(bytes, logical, originalHashes);
      if (path.endsWith(".map")) {
        const map = JSON.parse(bytes);
        for (const source of map.sourcesContent ?? []) if (source !== null) inspectCode(Buffer.from(source), logical, originalHashes);
      }
      inventory.push({ path: logical, bytes: bytes.length, sha256: hash(bytes) });
    }
  };
  await visit(root, new Set());
  assert.ok(inventory.length > 0, "Empty artifact directory");
  return inventory;
}

async function originalSourceHashes(graph) {
  const hashes = new Set();
  const visit = async (path) => {
    const stat = await lstat(path);
    assert.ok(!stat.isSymbolicLink(), "Unexpected link in reference dependency");
    if (stat.isDirectory()) {
      for (const name of await readdir(path)) if (name !== "node_modules") await visit(join(path, name));
    } else if (/\.[cm]?js$/.test(path)) hashes.add(hash(await readFile(path)));
  };
  for (const pkg of graph.installed) await visit(join(web, pkg.path));
  assert.ok(hashes.size > 0);
  return hashes;
}

export async function inspectArtifact(policy) {
  const graph = await readGraph(policy);
  const next = join(web, ".next");
  const buildId = (await readFile(join(next, "BUILD_ID"), "utf8")).trim();
  assert.ok(buildId.length > 0);
  const root = join(next, "standalone");
  const candidates = [root, join(root, "apps/web")];
  let entryRoot;
  for (const candidate of candidates) {
    try { if ((await lstat(join(candidate, "server.js"))).isFile()) { entryRoot = candidate; break; } }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  assert.ok(entryRoot, "Standalone entry missing");
  assert.equal((await readFile(join(entryRoot, ".next/BUILD_ID"), "utf8")).trim(), buildId);
  const originalHashes = await originalSourceHashes(graph);
  const options = { originalHashes, devRoots: [await realpath(join(web, "node_modules"))] };
  const inventory = await inventoryTree(root, options);
  const staticFiles = await inventoryTree(join(next, "static"), options);
  const published = await inventoryTree(join(entryRoot, ".next/static"), options);
  same(published, staticFiles); // preparation must publish the exact generated assets
  try {
    const publicFiles = await inventoryTree(join(web, "public"), options);
    same(await inventoryTree(join(entryRoot, "public"), options), publicFiles);
  } catch (error) {
    if (error.code !== "ENOENT" || (await readdir(web)).includes("public")) throw error;
  }
  const traces = await inspectTraces(next, web, graph.lock);
  assert.ok(inventory.some((f) => f.path.endsWith("node_modules/next/package.json")), "Runtime package inventory incomplete");
  return {
    buildId, lockHash: graph.lockHash, originalSourceHashes: hashesToArray(originalHashes),
    inventorySha256: hash(JSON.stringify(inventory)), inventory, traces,
    manifestNote: "devDependencies declarations are metadata; executable files, imports, hashes, signatures and links were inspected",
  };
}

export async function inspectTraces(next, projectRoot, lock) {
  const traces = [];
  const traceWalk = async (dir) => {
    for (const name of (await readdir(dir)).sort()) {
      if (dir === next && ["standalone", "cache", "static"].includes(name)) continue;
      const path = join(dir, name);
      const stat = await lstat(path);
      assert.ok(!stat.isSymbolicLink(), "Unexpected trace symlink");
      if (stat.isDirectory()) await traceWalk(path);
      else if (name.endsWith(".nft.json")) {
        const trace = await json(path);
        const developmentMetadata = [];
        assert.ok(Array.isArray(trace.files) && trace.files.length > 0, "Incomplete trace");
        for (const file of trace.files) {
          assert.ok(typeof file === "string" && !isAbsolute(file));
          const resolved = await realpath(resolve(dirname(path), file));
          assert.ok(inside(projectRoot, resolved), "Trace escapes frontend");
          const rel = slash(relative(projectRoot, resolved));
          assert.ok(!names.some((pkg) => `/${rel}/`.includes(`/node_modules/${pkg}/`)), "Affected package in trace");
          for (const [pkgPath, pkg] of Object.entries(lock.packages)) {
            if (pkgPath && inside(join(projectRoot, pkgPath), resolved)) {
              if (pkg.dev === true) {
                // Next traces semver/package.json metadata; it does not trace its
                // development implementation. Never permit an affected package.
                assert.equal(rel, `${pkgPath}/package.json`, `Development dependency in trace: ${rel}`);
                developmentMetadata.push(rel);
              }
            }
          }
        }
        traces.push({ path: slash(relative(projectRoot, path)), files: trace.files.length, sha256: hash(await readFile(path)), developmentMetadata });
      }
    }
  };
  await traceWalk(next);
  for (const required of ["next-server.js.nft.json", "next-minimal-server.js.nft.json"]) {
    assert.ok(traces.some((t) => t.path === `.next/${required}`), "Required server trace missing");
  }
  const appPaths = await json(join(next, "server/app-paths-manifest.json"));
  assert.ok(object(appPaths) && Object.keys(appPaths).length > 0, "Missing App Router manifest");
  for (const path of Object.values(appPaths)) {
    assert.ok(typeof path === "string" && path.startsWith("app/") && !path.includes(".."));
    assert.ok(traces.some((t) => t.path === `.next/server/${path}.nft.json`), `Missing route trace: ${path}`);
  }
  return traces;
}

const hashesToArray = (hashes) => [...hashes].sort();

export function runProcess(command, args, { cwd = web, timeout = 120_000 } = {}) {
  return new Promise((done) => {
    let stdout = "", stderr = "", error, timedOut = false;
    const child = spawn(command, args, { cwd, env: process.env, shell: false, windowsHide: true });
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeout);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (failure) => { error = failure.message; });
    child.on("close", (code, signal) => { clearTimeout(timer); done({ stdout, stderr, code, signal, error, timedOut }); });
  });
}

async function git(args) {
  const result = await runProcess("git", args);
  assert.equal(result.code, 0, "Cannot verify Git context");
  return result.stdout.trim();
}

async function executionContext() {
  const revision = await git(["rev-parse", "HEAD"]);
  if (process.env.GITHUB_ACTIONS === "true") {
    const event = await json(process.env.GITHUB_EVENT_PATH);
    return {
      github: true, os: process.platform, repository: process.env.GITHUB_REPOSITORY,
      event: process.env.GITHUB_EVENT_NAME, revision: process.env.GITHUB_SHA, checkedOutRevision: revision,
      branch: event.pull_request?.head.ref ?? process.env.GITHUB_REF?.replace(/^refs\/heads\//, ""),
      pullRequest: event.number, headRepository: event.pull_request?.head.repo.full_name,
      baseBranch: event.pull_request?.base.ref, ref: process.env.GITHUB_REF,
      headRevision: event.pull_request?.head.sha ?? revision,
    };
  }
  const origin = await git(["remote", "get-url", "origin"]);
  assert.ok(["https://github.com/KevinhosUTP/n8n-qa-selfhosted.git", "git@github.com:KevinhosUTP/n8n-qa-selfhosted.git"].includes(origin));
  return { github: false, os: process.platform, event: "local", revision, repository: "KevinhosUTP/n8n-qa-selfhosted", branch: await git(["branch", "--show-current"]), dirty: Boolean(await git(["status", "--porcelain"])) };
}

export function evaluateFoundation(context, attestation) {
  if (context.github) {
    assert.equal(attestation.result, "success", "Foundation/Linux verification did not succeed");
    assert.equal(attestation.revision, context.revision, "Artifact and audit revisions differ");
    assert.match(attestation.inventoryHash ?? "", /^[a-f0-9]{64}$/, "Missing artifact inventory evidence");
  }
}

async function main() {
  const command = process.argv[2];
  assert.ok(["dependencies", "exposure", "artifact"].includes(command) && process.argv.length === 3, "Only dependencies, exposure or artifact; no date overrides");
  const result = { control: command, timestamp: new Date().toISOString(), os: process.platform, osRelease: release(), arch: arch(), node: process.version, status: "failed" };
  try {
    // Always run and disclose the full audit before checking expiry, graph or context.
    if (command === "dependencies") {
      assert.ok(process.env.npm_execpath, "Run via npm run security:dependencies");
      result.process = await runProcess(process.execPath, [process.env.npm_execpath, "audit", "--include=dev", "--json", "--audit-level=low"]);
      console.log("FULL npm audit (including dev):\n" + result.process.stdout);
      if (result.process.stderr) console.error(result.process.stderr);
    }
    const policy = await json(join(repository, ".github/security/sec-pr01-01.json"));
    result.policy = { id: policy.id, owner: policy.owner, expiresAt: policy.expiresAt, advisory: policy.advisory, cve: policy.cve };
    const audit = command === "dependencies" ? evaluateAudit(result.process, policy) : undefined;
    if (audit) result.auditStatus = audit.status;
    result.context = await executionContext();
    evaluateAuthorization(policy, result.context, new Date());
    if (command === "dependencies") {
      const graph = await readGraph(policy);
      assert.equal(audit.report.metadata.dependencies.total, Object.keys(graph.lock.packages).length - 1, "Audit dependency inventory differs from lockfile");
      result.lockHash = graph.lockHash;
      result.acceptanceGate = result.context.github ? "Linux-foundation-required" : "local-only-not-technical-acceptance";
      result.foundation = {
        result: process.env.SEC_FOUNDATION_RESULT, revision: process.env.SEC_ARTIFACT_REVISION,
        inventoryHash: process.env.SEC_ARTIFACT_INVENTORY_HASH,
      };
      evaluateFoundation(result.context, result.foundation);
      if (result.auditStatus === "temporarily-accepted-not-fixed") {
        result.warning = `WARNING: SEC-PR01-01 TEMPORARILY ACCEPTED, NOT FIXED. Owner: ${policy.owner}. Expires: ${policy.expiresAt} (${policy.expiresLocal} America/Lima).`;
        console.warn(result.warning);
      } else {
        result.warning = "sin hallazgos in this audit; this does not assert that the vulnerability has been fixed";
      }
    } else if (command === "exposure") result.evidence = await inspectExposure(policy);
    else {
      result.evidence = await inspectArtifact(policy);
      result.linuxVerified = process.platform === "linux" && result.context.github;
      evaluateAuthorization(policy, result.context, new Date());
      if (process.env.GITHUB_OUTPUT) {
        assert.ok(result.linuxVerified, "Linux GitHub evidence required for job output");
        await appendFile(process.env.GITHUB_OUTPUT, `revision=${result.context.revision}\ninventory_hash=${result.evidence.inventorySha256}\n`);
      }
    }
    evaluateAuthorization(policy, result.context, new Date());
    result.status = "passed";
  } catch (error) {
    result.error = error.message;
    process.exitCode = 1;
  } finally {
    const text = JSON.stringify(result, null, 2);
    const directory = join(repository, ".tools/security");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${command}.json`), text + "\n");
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `### SEC-PR01-01: ${command} — ${result.status}\n\n\`\`\`json\n${text}\n\`\`\`\n`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
