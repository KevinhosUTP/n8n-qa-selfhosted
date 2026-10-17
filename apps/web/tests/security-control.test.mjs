import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  evaluateAudit, evaluateAuthorization, evaluateDependencyDecision, evaluateEslint, evaluateFoundation,
  evaluateGraph, githubExecutionContext, inspectCode, inspectTraces, inventoryTree, runProcess,
  runInspection, validateExecutionContext, validatePolicy,
} from "../scripts/security-control.mjs";

const policy = JSON.parse(await readFile(new URL("../../../.github/security/sec-pr01-01.json", import.meta.url)));
const fixture = JSON.parse(await readFile(new URL("./fixtures/security-audit.json", import.meta.url)));
const clone = (value) => structuredClone(value);
const result = (report = clone(fixture), overrides = {}) => ({ code: 1, signal: null, timedOut: false, stdout: JSON.stringify(report), stderr: "", ...overrides });
const context = () => ({
  github: true, os: "linux", repository: policy.repository, branch: policy.authorizationOrigin.branch,
  event: "pull_request", pullRequest: 4, headRepository: policy.repository, baseBranch: "develop",
  revision: "a".repeat(40), checkedOutRevision: "a".repeat(40),
  ref: "refs/pull/4/merge", payloadPullRequest: 4, headFork: false,
  eventRepository: policy.repository, baseRepository: policy.repository, githubBaseRef: "develop",
  githubHeadRef: policy.authorizationOrigin.branch, headRevision: "b".repeat(40),
  workflowRef: `${policy.repository}/${policy.workflowPath}@refs/pull/4/merge`,
});
const pushContext = (branch = "develop") => ({
  github: true, os: "linux", repository: policy.repository, eventRepository: policy.repository,
  event: "push", branch, ref: `refs/heads/${branch}`, revision: "a".repeat(40),
  checkedOutRevision: "a".repeat(40), eventAfter: "a".repeat(40), eventRef: `refs/heads/${branch}`, deleted: false,
  workflowRef: `${policy.repository}/${policy.workflowPath}@refs/heads/${branch}`,
});
const foundation = () => ({ result: "success", revision: context().revision, inventoryHash: "c".repeat(64) });
const before = () => new Date("2026-11-01T04:58:59.999Z");
const temps = [];
const temp = async () => { const path = await mkdtemp(join(tmpdir(), "kevolint-security-test-")); temps.push(path); return path; };
const put = async (root, path, data) => {
  const target = resolve(root, path);
  expect(target.startsWith(root)).toBe(true);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, data);
};
afterEach(async () => {
  for (const path of temps.splice(0)) {
    expect(path.startsWith(join(tmpdir(), "kevolint-security-test-"))).toBe(true);
    await rm(path, { recursive: true, force: true });
  }
});

describe("full audit, exact exception and expiry", () => {
  it("accepts only the approved chain before expiry", () => {
    expect(() => evaluateAuthorization(policy, context(), before())).not.toThrow();
    expect(evaluateAudit(result(), policy).status).toBe("temporarily-accepted-not-fixed");
  });
  it.each(["2026-11-01T04:59:00Z", "2026-11-02T00:00:00Z"])("rejects at/after expiry: %s", (date) => {
    expect(() => evaluateAuthorization(policy, context(), new Date(date))).toThrow(/expired/);
  });
  it("reports a clean audit as sin hallazgos, without claiming a fix", () => {
    const clean = clone(fixture);
    clean.vulnerabilities = {};
    for (const key of Object.keys(clean.metadata.vulnerabilities)) clean.metadata.vulnerabilities[key] = 0;
    expect(evaluateAudit(result(clean, { code: 0 }), policy).status).toBe("sin hallazgos");
    expect(() => evaluateAudit(result(clean), policy)).toThrow();
    expect(() => evaluateAuthorization(policy, context(), new Date(policy.expiresAt))).toThrow();
  });
  it.each([
    ["additional vulnerability", (r) => { r.vulnerabilities.other = { ...r.vulnerabilities.braces, name: "other" }; r.metadata.vulnerabilities.total++; r.metadata.vulnerabilities.high++; }],
    ["different advisory", (r) => { r.vulnerabilities.braces.via[0].url = "https://github.com/advisories/GHSA-other"; }],
    ["second via root", (r) => { r.vulnerabilities.braces.via.push({ ...r.vulnerabilities.braces.via[0] }); }],
    ["increased severity", (r) => { r.vulnerabilities.braces.via[0].severity = "critical"; }],
    ["incoherent counters", (r) => { r.metadata.vulnerabilities.total = 0; }],
    ["missing dependency counters", (r) => { delete r.metadata.dependencies; }],
    ["missing via node", (r) => { r.vulnerabilities.micromatch.via = ["unknown"]; }],
    ["cycle", (r) => { r.vulnerabilities.braces.via = ["fast-glob"]; }],
    ["unexpected package copy", (r) => { r.vulnerabilities.braces.nodes.push("node_modules/other/node_modules/braces"); }],
    ["compatible fix indication", (r) => { r.vulnerabilities.braces.fixAvailable = true; }],
    ["missing mandatory name", (r) => { delete r.vulnerabilities.braces.name; }],
    ["wrong report version", (r) => { r.auditReportVersion = 1; }],
    ["npm error object", (r) => { r.error = { code: "ENETWORK" }; }],
  ])("rejects %s", (_, change) => {
    const report = clone(fixture); change(report);
    expect(() => evaluateAudit(result(report), policy)).toThrow();
  });
  it.each([
    { stdout: "not-json" }, { stdout: '{"auditReportVersion":2,' }, { stdout: "{}" },
    { error: "spawn ENOENT" }, { timedOut: true }, { signal: "SIGKILL" },
    { code: 0 }, { code: 2 }, { stderr: "network failure ENOTFOUND" },
  ])("rejects malformed/incomplete/process/network failure %j", (change) => {
    expect(() => evaluateAudit(result(clone(fixture), change), policy)).toThrow();
  });
  it("captures actual spawn errors and bounded process timeouts", async () => {
    const failed = await runProcess("kevolint-nonexistent-executable", []);
    expect(failed.error).toBeTruthy();
    const timed = await runProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeout: 30 });
    expect(timed.timedOut).toBe(true);
    expect(() => evaluateAudit(timed, policy)).toThrow();
  });
});

describe("execution scope and foundation evidence", () => {
  const payloadFixture = (eventName = "pull_request", branch = "develop") => {
    const pr = eventName === "pull_request";
    const ref = pr ? "refs/pull/12/merge" : `refs/heads/${branch}`;
    const environment = {
      GITHUB_REPOSITORY: policy.repository, GITHUB_EVENT_NAME: eventName,
      GITHUB_SHA: "a".repeat(40), GITHUB_REF: ref,
      GITHUB_WORKFLOW_REF: `${policy.repository}/${policy.workflowPath}@${ref}`,
      ...(pr ? { GITHUB_BASE_REF: branch, GITHUB_HEAD_REF: "feature/internal" } : {}),
    };
    const event = { repository: { full_name: policy.repository }, ...(pr ? {
      number: 12, pull_request: { number: 12,
        head: { ref: "feature/internal", sha: "b".repeat(40), repo: { full_name: policy.repository, fork: false } },
        base: { ref: branch, repo: { full_name: policy.repository } },
      },
    } : { after: "a".repeat(40), ref, deleted: false }) };
    return { environment, event };
  };
  it.each(["push", "pull_request"])("parses a GitHub %s payload and workflow ref without confusing head and merge SHA", (name) => {
    const { environment, event } = payloadFixture(name);
    const parsed = githubExecutionContext(environment, event, "a".repeat(40), "linux");
    expect(() => evaluateAuthorization(policy, parsed, before())).not.toThrow();
    expect(parsed.workflowRef).toBe(environment.GITHUB_WORKFLOW_REF);
    expect(parsed.headRevision).toBe((name === "pull_request" ? "b" : "a").repeat(40));
  });
  it("cannot accept a fork by reusing the allowed PR number or branch name in raw payloads", () => {
    const { environment, event } = payloadFixture();
    event.pull_request.head.repo = { full_name: "external/n8n-qa-selfhosted", fork: true };
    expect(() => evaluateAuthorization(policy, githubExecutionContext(environment, event, "a".repeat(40), "linux"), before())).toThrow(/forbidden/);
  });
  it.each(["push", "pull_request"])("parses main %s context for full inspection while denying the exception", (name) => {
    const { environment, event } = payloadFixture(name, "main");
    const parsed = githubExecutionContext(environment, event, "a".repeat(40), "linux");
    expect(() => validateExecutionContext(policy, parsed)).not.toThrow();
    expect(() => evaluateAuthorization(policy, parsed, before())).toThrow(/forbidden/);
  });
  it.each([
    { repository: "other/repo" }, { branch: "main", githubHeadRef: "main" }, { pullRequest: 3 },
    { headRepository: "fork/repo" }, { os: "win32" }, { baseBranch: "main" },
    { checkedOutRevision: "b".repeat(40) }, { event: "workflow_dispatch" },
    { eventRepository: "other/repo" }, { baseRepository: "other/repo" }, { headFork: true },
    { headFork: undefined }, { headRepository: undefined }, { payloadPullRequest: 5 },
    { pullRequest: undefined }, { pullRequest: 0 }, { pullRequest: 4.5 },
    { ref: "refs/pull/5/merge" }, { ref: "refs/heads/develop" }, { baseBranch: "release", githubBaseRef: "release" },
    { githubBaseRef: "main" }, { githubHeadRef: "other" }, { headRevision: "invalid" },
    { event: "pull_request_target" }, { event: "deployment" }, { event: "deployment_status" },
    { event: "release" }, { event: "schedule" }, { event: "workflow_call" },
    { workflowRef: undefined },
    { workflowRef: `${policy.repository}/.github/workflows/deploy.yml@refs/pull/4/merge` },
    { workflowRef: `${policy.repository}/other/frontend-checks.yml@refs/pull/4/merge` },
    { workflowRef: `other/repo/${policy.workflowPath}@refs/pull/4/merge` },
    { workflowRef: `${policy.repository}/${policy.workflowPath}@refs/heads/develop` },
    { workflowRef: `${policy.repository}/${policy.workflowPath}@refs/pull/5/merge` },
  ])("rejects context drift %j", (change) => {
    expect(() => evaluateAuthorization(policy, { ...context(), ...change }, before())).toThrow();
  });
  it("accepts a different internal PR only with coherent merge/workflow refs", () => {
    const internal = { ...context(), branch: "feature/example", githubHeadRef: "feature/example",
      pullRequest: 9, payloadPullRequest: 9, ref: "refs/pull/9/merge",
      workflowRef: `${policy.repository}/${policy.workflowPath}@refs/pull/9/merge` };
    expect(() => evaluateAuthorization(policy, internal, before())).not.toThrow();
  });
  it("allows develop pushes with the exact authorized workflow ref", () => {
    expect(() => evaluateAuthorization(policy, pushContext(), before())).not.toThrow();
  });
  it.each(["main", "feature/example", "codex/kevolint-pr01-foundation", "release", "develop-evil"])("rejects push acceptance on %s", (branch) => {
    expect(() => evaluateAuthorization(policy, pushContext(branch), before())).toThrow();
  });
  it.each([
    { ref: "refs/tags/develop" }, { ref: "refs/heads/main" }, { eventAfter: "b".repeat(40) },
    { eventRef: "refs/heads/main" }, { eventRef: undefined },
    { eventAfter: undefined }, { deleted: true }, { deleted: undefined },
    { workflowRef: `${policy.repository}/${policy.workflowPath}@refs/pull/4/merge` },
    { workflowRef: `${policy.repository}/.github/workflows/deployment.yml@refs/heads/develop` },
  ])("rejects contradictory push metadata %j", (change) => {
    expect(() => evaluateAuthorization(policy, { ...pushContext(), ...change }, before())).toThrow();
  });
  it.each([
    (p) => { p.acceptanceContexts.pushBranches.push("main"); },
    (p) => { p.acceptanceContexts.pullRequests.baseBranch = "main"; },
    (p) => { p.acceptanceContexts.pullRequests.sameRepositoryOnly = false; },
    (p) => { p.acceptanceContexts.pullRequests.excludedHeadBranches = []; },
    (p) => { p.workflowPath = ".github/workflows/deploy.yml"; },
    (p) => { p.expiresAt = "2026-12-01T04:59:00Z"; },
    (p) => { p.chain[3].version = "3.0.4"; },
    (p) => { p.lockfileSha256 = "0".repeat(64); },
  ])("rejects policy scope/expiry/dependency extensions", (change) => {
    const changed = clone(policy); change(changed);
    expect(() => validatePolicy(changed)).toThrow();
  });
  it("preserves local diagnostics without broadening local branch scope or claiming Linux", () => {
    const local = { ...context(), github: false, os: "win32", event: "local" };
    expect(() => evaluateAuthorization(policy, local, before())).not.toThrow();
    expect(() => evaluateAuthorization(policy, { ...local, branch: "develop" }, before())).toThrow();
    const decision = evaluateDependencyDecision(policy, local, before(), evaluateAudit(result(), policy), {});
    expect(decision.temporaryAcceptance).toBe(false);
    expect(decision.acceptanceGate).toBe("local-only-not-technical-acceptance");
  });
  it.each([pushContext("main"), { ...context(), baseBranch: "main", githubBaseRef: "main" },
    { ...context(), headRepository: "fork/repo", headFork: true },
    { ...context(), branch: "main", githubHeadRef: "main" },
  ])("runs full inspections in strict context without accepting findings: %j", async (strict) => {
    expect(() => validateExecutionContext(policy, strict)).not.toThrow();
    const calls = [];
    for (const command of ["exposure", "artifact"]) {
      const scan = await runInspection(policy, strict, async () => { calls.push(command); return { command }; }, before);
      expect(scan.mode).toBe("strict-inspection-no-exception");
      expect(scan.evidence.command).toBe(command);
    }
    expect(calls).toEqual(["exposure", "artifact"]);
    const audit = evaluateAudit(result(), policy); // full report is still evaluated
    expect(() => evaluateDependencyDecision(policy, strict, before(), audit, foundation())).toThrow(/forbidden/);
  });
  it("strict main inspections propagate scanner failures and continue to run after expiry", async () => {
    const strict = pushContext("main");
    await expect(runInspection(policy, strict, async () => { throw Error("inspection failed"); }, before)).rejects.toThrow(/inspection failed/);
    const scanned = await runInspection(policy, strict, async () => "scanned", () => new Date(policy.expiresAt));
    expect(scanned.evidence).toBe("scanned");
  });
  it("fails an unauthorized workflow instead of reporting an unexecuted inspection as passed", async () => {
    let called = false;
    await expect(runInspection(policy, { ...pushContext("main"), workflowRef: "wrong" }, async () => { called = true; })).rejects.toThrow(/workflow/);
    expect(called).toBe(false); // invalid execution identity fails; not a successful bypass
  });
  it("rejects an inspection that crosses expiry", async () => {
    const times = [before(), new Date(policy.expiresAt)];
    await expect(runInspection(policy, context(), async () => "scanned", () => times.shift())).rejects.toThrow(/expired/);
  });
  it("clean strict main audit succeeds without an exception; clean develop still observes expiry", () => {
    const clean = { status: "sin hallazgos" };
    const decision = evaluateDependencyDecision(policy, pushContext("main"), new Date(policy.expiresAt), clean, foundation());
    expect(decision.temporaryAcceptance).toBe(false);
    expect(decision.acceptanceGate).toBe("strict-clean-audit");
    expect(() => evaluateDependencyDecision(policy, pushContext(), new Date(policy.expiresAt), clean, foundation())).toThrow(/expired/);
  });
  it.each([context(), pushContext()])("requires the Linux gate before accepting the approved root: %j", (allowed) => {
    const audit = evaluateAudit(result(), policy);
    const decision = evaluateDependencyDecision(policy, allowed, before(), audit, foundation());
    expect(decision.temporaryAcceptance).toBe(true);
    expect(decision.acceptanceGate).toBe("verified-linux-foundation");
    expect(() => evaluateDependencyDecision(policy, allowed, before(), audit, { ...foundation(), result: "failure" })).toThrow(/Foundation/);
    expect(() => evaluateDependencyDecision(policy, allowed, before(), audit, { ...foundation(), revision: "d".repeat(40) })).toThrow(/revisions differ/);
    expect(() => evaluateDependencyDecision(policy, allowed, new Date(policy.expiresAt), audit, foundation())).toThrow(/expired/);
  });
  it.each(["failure", "cancelled", "skipped", undefined])("rejects unsuccessful foundation: %s", (state) => {
    expect(() => evaluateFoundation(context(), { result: state, revision: context().revision, inventoryHash: "a".repeat(64) })).toThrow();
  });
  it("requires Linux artifact evidence for the identical commit", () => {
    const attestation = { result: "success", revision: context().revision, inventoryHash: "b".repeat(64) };
    expect(() => evaluateFoundation(context(), attestation)).not.toThrow();
    expect(() => evaluateFoundation(context(), { ...attestation, revision: "b".repeat(40) })).toThrow();
    expect(() => evaluateFoundation(context(), { ...attestation, inventoryHash: "" })).toThrow();
  });
});

function graphFixture() {
  const packages = {};
  const installed = policy.chain.map(({ name, version }, i) => {
    const path = `node_modules/${name}`;
    const dependencies = i < policy.chain.length - 1 ? { [policy.chain[i + 1].name]: policy.chain[i + 1].version } : {};
    packages[path] = { version, dev: true, dependencies };
    return { name, version, path, dependencies };
  });
  const manifest = { dependencies: { next: "16.4.2" }, devDependencies: { [policy.chain[0].name]: "16.4.2" } };
  packages[""] = clone(manifest);
  return { lockHash: policy.lockfileSha256, lock: { lockfileVersion: 3, packages }, manifest, installed };
}

describe("installed graph and effective ESLint configuration", () => {
  it("requires a development-only exact resolved graph", () => expect(() => evaluateGraph(policy, graphFixture())).not.toThrow());
  it.each([
    ["lock hash", (g) => { g.lockHash = "0".repeat(64); }],
    ["installed version", (g) => { g.installed[3].version = "3.0.4"; }],
    ["installed path", (g) => { g.installed[1].path = "node_modules/other/node_modules/fast-glob"; }],
    ["development classification", (g) => { delete g.lock.packages["node_modules/braces"].dev; }],
    ["manifest dependency", (g) => { g.manifest.dependencies.braces = "3.0.3"; }],
    ["resolved dependency edge", (g) => { g.installed[1].dependencies = {}; }],
    ["nested lock entry", (g) => { g.lock.packages["node_modules/a/node_modules/braces"] = { version: "3.0.3", dev: true }; }],
  ])("rejects unexpected %s", (_, change) => {
    const graph = graphFixture(); change(graph);
    expect(() => evaluateGraph(policy, graph)).toThrow();
  });
  it.each(["**", [], undefined])("rejects rootDir presence: %j", (rootDir) => {
    expect(() => evaluateEslint({ rules: {}, settings: { next: { rootDir } } })).toThrow(/rootDir/);
  });
  it("requires existing recommended rule families to remain enabled", () => {
    const required = { "@next/next/no-img-element": "warn", "react-hooks/rules-of-hooks": "error", "@typescript-eslint/no-explicit-any": "error" };
    expect(() => evaluateEslint({ rules: required }, required)).not.toThrow();
    expect(() => evaluateEslint({ rules: { ...required, "react-hooks/rules-of-hooks": "off" } }, required)).toThrow();
  });
});

describe("physical production artifact inspection", () => {
  async function traceFixture() {
    const root = await temp();
    await put(root, "runtime.js", "export const ok = true;");
    const trace = JSON.stringify({ files: ["../runtime.js"] });
    await put(root, ".next/next-server.js.nft.json", trace);
    await put(root, ".next/next-minimal-server.js.nft.json", trace);
    await put(root, ".next/server/app-paths-manifest.json", '{"/page":"app/page.js"}');
    await put(root, ".next/server/app/page.js.nft.json", '{"files":["../../../runtime.js"]}');
    return root;
  }
  it("requires every route trace and both server traces", async () => {
    const root = await traceFixture(); const next = join(root, ".next"); const lock = { packages: {} };
    expect((await inspectTraces(next, root, lock)).length).toBe(3);
    await rm(join(next, "server/app/page.js.nft.json"));
    await expect(inspectTraces(next, root, lock)).rejects.toThrow(/Missing route trace/);
    await rm(join(next, "next-server.js.nft.json"));
    await expect(inspectTraces(next, root, lock)).rejects.toThrow(/Required server trace/);
  });
  it.each(['{"files":[]}', '{"files":', '{}', '{"files":["../missing.js"]}'])("rejects incomplete/unreadable trace %s", async (trace) => {
    const root = await traceFixture();
    await put(root, ".next/next-server.js.nft.json", trace);
    await expect(inspectTraces(join(root, ".next"), root, { packages: {} })).rejects.toThrow();
  });
  it("rejects a development dependency in an NFT trace", async () => {
    const root = await traceFixture();
    await put(root, "node_modules/dev-tool/index.js", "const tool = 1;");
    await put(root, ".next/next-server.js.nft.json", '{"files":["../node_modules/dev-tool/index.js"]}');
    await expect(inspectTraces(join(root, ".next"), root, { packages: { "node_modules/dev-tool": { dev: true } } })).rejects.toThrow(/Development dependency/);
  });
  it("records non-affected dev package metadata without treating it as executable code", async () => {
    const root = await traceFixture();
    await put(root, "node_modules/semver/package.json", '{"name":"semver"}');
    await put(root, ".next/next-server.js.nft.json", '{"files":["../node_modules/semver/package.json"]}');
    const traces = await inspectTraces(join(root, ".next"), root, { packages: { "node_modules/semver": { dev: true } } });
    expect(traces.some((trace) => trace.developmentMetadata.includes("node_modules/semver/package.json"))).toBe(true);
  });
  it("allows devDependency declarations, comments and unrelated brace names", async () => {
    const root = await temp();
    await put(root, "package.json", JSON.stringify({ name: "@kevolint/web", devDependencies: { braces: "3.0.3" } }));
    await put(root, "runtime.js", '// require("braces"); expanded array length exceeds range limit. Use options.rangeLimit\nconst bracesCount = 1;');
    expect((await inventoryTree(root)).length).toBe(2);
  });
  it.each(policy.chain.map(({ name }) => name))("rejects physical nested %s", async (name) => {
    const root = await temp();
    await put(root, `node_modules/runtime/node_modules/${name}/package.json`, JSON.stringify({ name }));
    await expect(inventoryTree(root)).rejects.toThrow(/Affected/);
  });
  it("detects renamed affected package manifests", async () => {
    const root = await temp(); await put(root, "vendor/package.json", '{"name":"braces"}');
    await expect(inventoryTree(root)).rejects.toThrow(/Affected physical/);
  });
  it("rejects a vulnerable signature in a static chunk", async () => {
    const root = await temp();
    await put(root, "static/chunks/app.js", 'throw Error("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.")');
    await expect(inventoryTree(root)).rejects.toThrow(/signature/);
  });
  it.each(['const a=require("braces")', 'import("micromatch")', 'import a from "fast-glob"', 'import "@next/eslint-plugin-next"'])("rejects executable import %s", (source) => {
    expect(() => inspectCode(Buffer.from(source), "runtime.js")).toThrow(/import/);
  });
  it("detects original file hashes even if renamed", async () => {
    const root = await temp(); const source = Buffer.from("synthetic original vulnerable module");
    await put(root, "renamed.bin", source);
    await expect(inventoryTree(root, { originalHashes: new Set([createHash("sha256").update(source).digest("hex")]) })).rejects.toThrow(/hash/);
  });
  it("inspects safe internal runtime links fully", async () => {
    const root = await temp(); await put(root, "runtime/module.js", "export const ok = 1;");
    await symlink(join(root, "runtime"), join(root, "alias"), "junction");
    expect((await inventoryTree(root)).some((f) => f.path === "alias/module.js")).toBe(true);
    await put(root, "runtime/bad.js", 'require("braces")');
    await expect(inventoryTree(root)).rejects.toThrow(/import/);
  });
  it("rejects links to external development dependencies", async () => {
    const root = await temp(); const external = await temp();
    await put(external, "index.js", "export const value = 1;");
    await symlink(external, join(root, "dependency"), "junction");
    await expect(inventoryTree(root)).rejects.toThrow(/External symlink/);
  });
  it("rejects internal development destinations", async () => {
    const root = await temp(); await put(root, "dev/index.js", "const x = 1;");
    await expect(inventoryTree(root, { devRoots: [join(root, "dev")] })).rejects.toThrow(/Development/);
  });
  it("rejects broken links, cycles, missing directories and empty artifacts", async () => {
    const root = await temp(); const external = await temp();
    await mkdir(join(external, "missing"));
    await symlink(join(external, "missing"), join(root, "broken"), "junction");
    await rm(join(external, "missing"), { recursive: true });
    await expect(inventoryTree(root)).rejects.toThrow();
    await rm(join(root, "broken"));
    await symlink(root, join(root, "cycle"), "junction");
    await expect(inventoryTree(root)).rejects.toThrow(/cycle/);
    await rm(join(root, "cycle"));
    await expect(inventoryTree(join(root, "missing"))).rejects.toThrow();
    await expect(inventoryTree(root)).rejects.toThrow(/Empty/);
  });
});
