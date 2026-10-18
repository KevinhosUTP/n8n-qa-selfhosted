// Optional local real-browser verification. Uses an already installed Chrome/Edge
// and Node's built-in WebSocket; installs no browser, package or test dependency.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:3103";
const evidence = resolve("../../.tools/pr03/browser");
const profile = await mkdtemp(join(tmpdir(), "kevolint-browser-"));
const candidates = process.platform === "win32"
  ? ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch { /* next installed browser */ } }
assert.ok(executable, "No existing supported browser; do not install one without authorization");
await mkdir(evidence, { recursive: true });
const browser = spawn(executable, ["--headless=new", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "about:blank"], { windowsHide: true, stdio: "ignore" });
let socket;
const report = { browser: {}, sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), note: "Local browser evidence; this does not certify the Linux security artifact or integral WCAG conformance.", responsive: [], states: [], keyboard: {}, resources: [], images: [], typography: [] };
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n"); break; } catch { await delay(100); }
  }
  assert.ok(port, "Browser debugging endpoint did not start");
  socket = new WebSocket(`ws://127.0.0.1:${port[0]}${port[1]}`);
  await new Promise((ok, fail) => { socket.addEventListener("open", ok, { once: true }); socket.addEventListener("error", fail, { once: true }); });
  let id = 0;
  const pending = new Map();
  const resources = new Set();
  const runtimeErrors = [];
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown") runtimeErrors.push(msg.params.exceptionDetails);
    if (msg.method === "Network.requestWillBeSent") resources.add(msg.params.request.url);
    if (pending.has(msg.id)) {
      const { ok, fail, timer } = pending.get(msg.id); clearTimeout(timer); pending.delete(msg.id);
      if (msg.error) fail(new Error(JSON.stringify(msg.error))); else ok(msg.result);
    }
  });
  function send(method, params = {}, sessionId) {
    return new Promise((ok, fail) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); fail(new Error(`CDP timeout: ${method}`)); }, 15_000);
      pending.set(requestId, { ok, fail, timer });
      socket.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  report.browser = await send("Browser.getVersion");
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const cmd = (method, params = {}) => send(method, params, sessionId);
  for (const method of ["Page.enable", "Runtime.enable", "Network.enable", "DOM.enable", "CSS.enable"]) await cmd(method);
  const evaluate = async (expression) => {
    const result = await cmd("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  async function until(expression, message) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await delay(60);
    }
    console.error(JSON.stringify({ message, runtimeErrors, state: await evaluate('({active:document.activeElement?.tagName,path:location.pathname,trigger:document.querySelector(\'[aria-label="Abrir menú"]\')?.getAttribute("aria-expanded"),open:!!document.querySelector("dialog[open]")})') }));
    assert.fail(message);
  }
  async function navigate(path) {
    await evaluate('window.__kevolintTestDocument = true');
    await cmd("Page.navigate", { url: `${origin}${path}` });
    await until(`!window.__kevolintTestDocument && location.pathname === ${JSON.stringify(path)}`, `New document not committed: ${path}`);
    await until('document.readyState === "complete" && !!document.querySelector("main") && document.fonts.status === "loaded"', `Page not ready: ${path}`);
    // PR04 makes public pages long. Load original lazy resources and reveal
    // sections before retaining the existing image and layout assertions.
    await evaluate('(async()=>{for(const image of document.images){if(image.getClientRects().length){image.scrollIntoView({block:"center"});await image.decode();}}scrollTo(0,0);})()');
    await delay(300);
  }
  async function key(key, code, windowsVirtualKeyCode, modifiers = 0) {
    const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
    await cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode, modifiers, ...(text ? { text, unmodifiedText: text } : {}) });
    await cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode, modifiers });
  }
  async function click(selector, modifiers = 0) {
    const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    for (const type of ["mousePressed", "mouseReleased"]) await cmd("Input.dispatchMouseEvent", { type, button: "left", clickCount: 1, modifiers, ...point });
  }
  async function shot(name) {
    // Exclude Next's development tooling overlay, never application content.
    await evaluate('document.querySelector("nextjs-portal")?.remove()');
    const metrics = await cmd("Page.getLayoutMetrics");
    const { data } = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 } });
    await writeFile(join(evidence, `${name}.png`), Buffer.from(data, "base64"));
  }
  async function shotElement(selector, name) {
    const rect = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`);
    const { data } = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...rect, scale: 1 } });
    await writeFile(join(evidence, `${name}.png`), Buffer.from(data, "base64"));
  }
  async function open(pointer = false) {
    if (pointer) await click('[aria-label="Abrir menú"]');
    else {
      await evaluate('document.querySelector(\'[aria-label="Abrir menú"]\').focus()');
      await key("Enter", "Enter", 13);
    }
    await until('!!document.querySelector("dialog[open]")', "Drawer did not open");
    await delay(270);
    assert.ok(await evaluate('document.querySelector("dialog").matches(":modal")'), "Native modal layer missing");
    assert.ok(await evaluate('document.activeElement.hasAttribute("data-modal-initial-focus")'), "Initial focus is not close button");
    assert.equal(await evaluate('document.body.style.position'), "fixed");
  }
  async function closed() {
    await until('!document.querySelector("dialog[open]")', "Drawer did not close");
    assert.notEqual(await evaluate('document.body.style.position'), "fixed", "Scroll lock leaked");
  }
  async function renderedContrast(selector, state) {
    const result = await evaluate(`(()=>{
      const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);
      const rgb=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number);
      let p=e;while(p&&getComputedStyle(p).backgroundColor==="rgba(0, 0, 0, 0)")p=p.parentElement;
      const bg=rgb(getComputedStyle(p).backgroundColor),fg=rgb(s.color);
      const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const surrounding=rgb(getComputedStyle(e.closest("dialog")?document.querySelector("dialog > div"):document.body).backgroundColor);
      return {selector:${JSON.stringify(selector)},state:${JSON.stringify(state)},text:ratio(fg,bg),focus:ratio(rgb(s.outlineColor),surrounding),height:e.getBoundingClientRect().height,opacity:s.opacity};
    })()`);
    assert.equal(result.opacity, "1");
    assert.ok(result.text >= 4.5, `Rendered text contrast: ${JSON.stringify(result)}`);
    assert.ok(result.height >= 44, "Interactive target below product minimum");
    if (state === "focus") assert.ok(result.focus >= 3, "Focus contrast below 3:1");
    report.states.push(result);
  }
  const widths = [320, 390, 767, 768, 1023, 1024, 1440];
  for (const width of widths) {
    const height = width === 768 ? 1024 : width === 1440 ? 900 : 844;
    await cmd("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await navigate("/");
    const sample = await evaluate(`(()=>{
      const header=document.querySelector("header"),footer=document.querySelector("footer"),main=document.querySelector("main");
      const container=main.firstElementChild;
      return {width:innerWidth,layoutViewport:document.documentElement.clientWidth,headerHeight:header.getBoundingClientRect().height,contentWidth:container.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,headerLinks:[...header.querySelectorAll('nav[aria-label="Principal"] a')].map(a=>({href:a.getAttribute("href"),width:a.getBoundingClientRect().width})),footerLinks:[...footer.querySelectorAll("nav a")].map(a=>a.getAttribute("href")),images:[...document.querySelectorAll('header img,footer img')].filter(i=>i.getClientRects().length).map(i=>({src:i.getAttribute("src"),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight}))};
    })()`);
    assert.equal(sample.headerHeight, width < 1024 ? 68 : 80);
    assert.equal(sample.overflow, false, `Page overflow at ${width}`);
    for (const image of sample.images.filter((image) => image.src.startsWith("/brand/"))) {
      assert.equal(image.width, 194);
      const asset = JSON.parse(await readFile("design-system/source/assets.json", "utf8")).assets.find((asset) => image.src.endsWith(asset.filename));
      assert.ok(asset, "Unknown brand image");
      const [originalWidth, originalHeight] = asset.exportedPixelBounds.map(Number);
      assert.ok(Math.abs(image.height - 194 * originalHeight / originalWidth) < 0.1, `Original SVG geometry: ${JSON.stringify(image)}`);
    }
    if ([320, 390, 768, 1440].includes(width)) {
      const gutter = { 320: 16, 390: 20, 768: 32, 1440: 32 }[width];
      assert.ok(Math.abs(sample.contentWidth - Math.min(1200, sample.layoutViewport - gutter * 2)) < 0.1, "Container must respect available viewport after native scrollbar and documented gutters");
      await shot(`public-layout-${width}`);
      await shotElement("header", `public-header-${width}`);
      await shotElement("footer", `public-footer-${width}`);
    }
    report.responsive.push(sample);
    if (width < 1024) {
      await open();
      const panel = await evaluate('document.querySelector("dialog > div").getBoundingClientRect().width');
      if ([320, 390, 768].includes(width)) {
        assert.equal(panel, { 320: 272, 390: 336, 768: 360 }[width]);
        await shot(`public-drawer-${width}`);
      }
      await key("Escape", "Escape", 27);
      await closed();
      assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'), "Abrir menú");
    }
  }
  await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await navigate("/");
  // Skip link is reached through a real native Tab from the document body.
  await evaluate('document.body.setAttribute("tabindex","-1");document.body.focus();document.body.removeAttribute("tabindex")');
  await key("Tab", "Tab", 9);
  assert.equal(await evaluate('document.activeElement.textContent'), "Saltar al contenido");
  await key("Enter", "Enter", 13);
  assert.equal(await evaluate('document.activeElement.id'), "main-content");
  await open(true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(\'dialog a[href="/sign-up"]\')).justifyContent'), "center", "Primary CTA alignment");
  for (const selector of ['dialog a[href="/precios"]', 'dialog a[href="/sign-up"]', '[data-modal-initial-focus]']) {
    await renderedContrast(selector, "default");
    const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await delay(200);
    await renderedContrast(selector, "hover");
    // Observe the real pressed paint without executing this probe's navigation/action.
    // Actual clicks and their effects are tested separately below.
    await evaluate('document.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation()},{once:true,capture:true})');
    await cmd("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point });
    await delay(160);
    await renderedContrast(selector, "pressed");
    await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
    await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: 370, y: 800 });
  }
  await evaluate('document.querySelector("[data-modal-initial-focus]").focus()');
  await key("Tab", "Tab", 9);
  await key("Tab", "Tab", 9, 8);
  await renderedContrast("[data-modal-initial-focus]", "focus");
  const count = await evaluate('document.querySelector("dialog").querySelectorAll("a[href],button:not(:disabled)").length');
  for (let i = 0; i < count; i++) await key("Tab", "Tab", 9);
  assert.ok(await evaluate('document.activeElement.hasAttribute("data-modal-initial-focus")'), "Forward cycle escaped");
  await key("Tab", "Tab", 9, 8);
  assert.equal(await evaluate('document.activeElement.getAttribute("href")'), "/sign-up", "Reverse cycle escaped");
  await evaluate('document.querySelector("[data-public-home]").focus()');
  assert.ok(await evaluate('document.activeElement.closest("dialog") !== null'), "Focus reached inert background");
  await key("Tab", "Tab", 9);
  const focus = await evaluate('(()=>{const s=getComputedStyle(document.activeElement);return {visible:document.activeElement.matches(":focus-visible"),width:s.outlineWidth}})()');
  assert.equal(focus.visible, true);
  assert.equal(focus.width, "2px");
  await shot("public-drawer-keyboard-focus");
  await key(" ", "Space", 32);
  await closed();
  await open(true);
  await click("[data-modal-initial-focus]");
  await closed();
  await open(true);
  await cmd("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, x: 375, y: 200 });
  await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, x: 375, y: 200 });
  await closed();
  report.keyboard = { skipLink: true, forwardCycle: true, reverseCycle: true, escape: true, enter: true, space: true, focusVisible: true, backgroundFocusBlocked: true, closePointer: true, scrimPointer: true };
  // Modified navigation opens its real destination in a separate tab, preserving this modal.
  await evaluate("scrollTo(0,400)");
  await open(true);
  const beforeTargets = (await send("Target.getTargets")).targetInfos.map((target) => target.targetId);
  await click('dialog a[href="/precios"]', 2);
  let added;
  for (let retry = 0; retry < 40; retry++) {
    added = (await send("Target.getTargets")).targetInfos.find((target) => !beforeTargets.includes(target.targetId) && target.type === "page");
    if (added) break;
    await delay(100);
  }
  assert.ok(added, "Ctrl+click did not open a native new tab");
  assert.ok(await evaluate('!!document.querySelector("dialog[open]")'), "Modified click closed current modal");
  await send("Target.closeTarget", { targetId: added.targetId });
  report.modifiedClick = true;
  await click('dialog a[href="/precios"]');
  await until('location.pathname === "/precios" && document.querySelector("h1")?.textContent.includes("La misma revisión")', "Implemented route did not reach pricing page");
  await until('document.activeElement === document.querySelector("main")', "Route focus was not placed in destination main");
  await closed();
  assert.equal(await evaluate("scrollY"), 0, "New route retained the old page scroll");
  const history = await cmd("Page.getNavigationHistory");
  await cmd("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex - 1].id });
  await until('location.pathname === "/" && !!document.querySelector("header")', "Back navigation failed");
  await cmd("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex].id });
  await until('location.pathname === "/precios"', "Forward navigation failed");
  report.historyNavigation = true;
  report.pendingRoutes = [];
  for (const path of ["/sign-in", "/sign-up"]) {
    const response = await fetch(`${origin}${path}`, { redirect: "manual" });
    assert.equal(response.status, 404, `Pending route must remain a real 404: ${path}`);
    assert.ok((await response.text()).includes("Página no encontrada"));
    report.pendingRoutes.push({ path, status: response.status, implemented: false });
  }
  await navigate("/");
  await open();
  await cmd("Emulation.setDeviceMetricsOverride", { width: 1024, height: 844, deviceScaleFactor: 1, mobile: false });
  await closed();
  assert.ok(await evaluate('document.activeElement.matches("[data-public-home]")'), "Desktop transition returned focus to hidden trigger");
  await cmd("Emulation.setDeviceMetricsOverride", { width: 320, height: 420, deviceScaleFactor: 1, mobile: false });
  await open();
  await evaluate('document.querySelector("dialog > div").scrollTop = 999');
  assert.ok(await evaluate('document.querySelector("dialog > div").scrollTop > 0'), "Short drawer cannot scroll");
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
  await key("Escape", "Escape", 27);
  await closed();
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await open();
  assert.equal(await evaluate('getComputedStyle(document.querySelector("dialog > div")).animationName'), "none");
  await key("Escape", "Escape", 27);
  await closed();
  report.reducedMotion = true;
  // Controlled fixture tests lifecycle cleanup and route-state matching, not product pages.
  await navigate("/pr03-public-preview");
  await evaluate('history.replaceState(null,"","/precios")');
  await until('document.querySelector(\'nav[aria-label="Principal"] a[href="/precios"]\')?.getAttribute("aria-current") === "page"', "Fixture current-route state missing");
  await open();
  await click('dialog a[href="/precios"]');
  await closed();
  assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'), "Abrir menú");
  await navigate("/pr03-public-preview");
  await evaluate('document.body.style.overflow="scroll";document.body.style.position="relative";window.scrollTo(0,400)');
  const saved = await evaluate('({style:document.body.getAttribute("style"),y:scrollY})');
  assert.equal(saved.y, 400);
  await evaluate('document.querySelector(\'[aria-label="Abrir menú"]\').click()');
  await until('!!document.querySelector("dialog[open]")', "Lifecycle fixture modal failed");
  await evaluate('document.querySelector("#toggle-public-header").click()');
  await until('!document.querySelector("header")', "Fixture header did not unmount");
  assert.deepEqual(await evaluate('({style:document.body.getAttribute("style"),y:scrollY})'), saved, "Unmount did not restore exact prior scroll styles/position");
  await evaluate('document.querySelector("#toggle-public-header").click();window.scrollTo(0,0)');
  await until('!!document.querySelector("header")', "Fixture header did not remount");
  await open();
  await key("Escape", "Escape", 27);
  await closed();
  report.lifecycleFixture = { unmountCleanup: true, remount: true, sameRouteClose: true, priorScrollAndStylesRestored: true, note: "Controlled fixture only; pending product pages remain HTTP 404." };
  report.resources = [...resources].filter((url) => /^https?:/.test(url));
  assert.ok(report.resources.every((url) => new URL(url).origin === origin), "Unexpected external resource");
  assert.deepEqual(runtimeErrors, [], "Uncaught browser error");
  report.passed = true;
  await writeFile(join(evidence, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`PASS: PR03 browser interaction, responsive, focus/inert background, scroll/lifecycle, route/history and pending HTTP statuses. Evidence: ${evidence}`);
} finally {
  socket?.close();
  if (browser.exitCode === null) browser.kill();
  await delay(1000);
  assert.equal(dirname(resolve(profile)), resolve(tmpdir()), "Refuse cleanup outside owned temporary parent");
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
}
