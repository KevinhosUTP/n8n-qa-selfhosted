// Optional local real-browser verification. Uses an already installed Chrome/Edge
// and Node's built-in WebSocket; installs no browser, package or test dependency.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:3102";
const evidence = resolve("../../.tools/pr02/browser");
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
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
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
  async function navigate(path) {
    await cmd("Page.navigate", { url: `${origin}${path}` });
    for (let i = 0; i < 100; i++) {
      if (await evaluate('document.readyState === "complete" && Boolean(document.querySelector("main")) && document.fonts.status === "loaded"')) return;
      await delay(100);
    }
    throw new Error("Page or local fonts did not become ready");
  }
  const screenshot = async (name) => {
    const shot = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(evidence, `${name}.png`), Buffer.from(shot.data, "base64"));
  };
  async function key(key, code, virtual, modifiers = 0) {
    const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
    await cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtual, modifiers, ...(text ? { text, unmodifiedText: text } : {}) });
    await cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtual, modifiers });
  }
  async function position(selector) {
    return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  }
  const count = () => evaluate('Number(document.getElementById("activation-count").textContent.split(": ")[1])');
  const readState = async (selector, state) => {
    const result = await evaluate(`(()=>{
      const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e),r=e.getBoundingClientRect();
      const parse=c=>c.match(/[\\d.]+/g).map(Number);
      let p=e.parentElement,bg=[0,0,0,0];
      while(p&&bg[3]===0){bg=parse(getComputedStyle(p).backgroundColor);p=p.parentElement;}
      const paint=(a,b,alpha)=>a.slice(0,3).map((v,i)=>v*alpha+b[i]*(1-alpha));
      const rawBg=parse(s.backgroundColor),rawFg=parse(s.color),opacity=Number(s.opacity);
      const filled=paint(rawBg,bg,rawBg[3]??1),background=paint(filled,bg,opacity),foreground=paint(rawFg,bg,opacity);
      const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      const x=lum(foreground),y=lum(background);
      const outline=lum(parse(s.outlineColor)),surround=lum(bg);
      return {id:e.id,state:${JSON.stringify(state)},foreground:s.color,background:s.backgroundColor,effectiveForeground:foreground,effectiveBackground:background,contrast:(Math.max(x,y)+.05)/(Math.min(x,y)+.05),focusContrast:(Math.max(outline,surround)+.05)/(Math.min(outline,surround)+.05),disabled:e.disabled,busy:e.getAttribute("aria-busy"),opacity,width:r.width,height:r.height,focusVisible:e.matches(":focus-visible"),hover:e.matches(":hover"),active:e.matches(":active"),outlineWidth:s.outlineWidth,outlineColor:s.outlineColor,transition:s.transitionDuration};
    })()`);
    report.states.push(result);
    assert.ok(result.height >= 44, `${selector}: target height`);
    if (!result.disabled || result.busy === "true") assert.ok(result.contrast >= 4.5, `${selector}/${state}: effective text contrast`);
    if (selector === "#hc-destructive" || selector === "#hc-destructive-loading") {
      assert.deepEqual(result.effectiveBackground, [255, 255, 255]);
      assert.deepEqual(result.effectiveForeground, [10, 11, 14]);
    }
    return result;
  };

  for (const width of [320, 390, 767, 768, 1023, 1024, 1440]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: width >= 768 ? 1024 : 844, deviceScaleFactor: 1, mobile: false });
    await navigate("/");
    await evaluate('(async()=>{for(const image of document.images){image.scrollIntoView({block:"center"});await image.decode();}scrollTo(0,0);})()');
    const page = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector("main").getBoundingClientRect().width,logo:[...document.images].map(e=>({src:e.getAttribute("src"),loaded:e.complete&&e.naturalWidth>0,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})');
    assert.ok(page.scrollWidth <= page.width, `Production page overflows at ${width}`);
    assert.ok(page.logo.every((x) => x.loaded));
    report.responsive.push({ ...page, route: "/" });
    if ([320, 390, 768, 1440].includes(width)) await screenshot(`technical-${width}`);
    await navigate("/pr02-design-preview");
    const fixture = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,longButtonHeight:document.getElementById("long-button").getBoundingClientRect().height})');
    assert.ok(fixture.scrollWidth <= width, `Fixture page overflows at ${width}`);
    assert.ok(fixture.longButtonHeight > 44, "Long button text must grow rather than crop");
    report.responsive.push({ ...fixture, route: "fixture" });
    if ([320, 390, 768, 1440].includes(width)) await screenshot(`components-${width}`);
  }

  await cmd("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate("/pr02-design-preview");
  await evaluate(' (async()=>{for(const image of document.images){image.scrollIntoView({block:"center"});await new Promise(ok=>requestAnimationFrame(ok));await image.decode();}scrollTo(0,0);})() ');
  await evaluate('document.fonts.load("500 14px inter")');
  report.typography = await evaluate('Array.from(document.querySelectorAll("[id^=type-]")).map(e=>{const s=getComputedStyle(e),r=document.createRange();r.selectNodeContents(e);return {role:e.id,text:e.textContent,family:s.fontFamily,weight:s.fontWeight,size:s.fontSize,lineHeight:s.lineHeight,tracking:s.letterSpacing,textWidth:r.getBoundingClientRect().width,fontsLoaded:document.fonts.check(s.fontWeight+" "+s.fontSize+" "+s.fontFamily.split(",")[0],e.textContent)};})');
  assert.ok(report.typography.every((t) => t.fontsLoaded), "Primary local font did not load");
  const { root: domRoot } = await cmd("DOM.getDocument");
  const { nodeId: labelNode } = await cmd("DOM.querySelector", { nodeId: domRoot.nodeId, selector: "#type-label" });
  report.platformFont = await cmd("CSS.getPlatformFontsForNode", { nodeId: labelNode });
  assert.ok(report.platformFont.fonts.some((f) => f.isCustomFont && /Inter/.test(f.familyName)), "Label rendered with a fallback font");
  const fullLayout = await cmd("Page.getLayoutMetrics");
  const full = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: fullLayout.cssContentSize.height, scale: 1 } });
  await writeFile(join(evidence, "components-and-original-brand-1440.png"), Buffer.from(full.data, "base64"));
  report.images = await evaluate('Array.from(document.images).map(e=>{const r=e.getBoundingClientRect();return {src:e.getAttribute("src"),alt:e.alt,loaded:e.complete&&e.naturalWidth>0,width:r.width,height:r.height,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight};})');
  for (const img of report.images) {
    assert.ok(img.loaded, `Unloaded image: ${img.src}`);
    assert.ok(Math.abs(img.width / img.height - img.naturalWidth / img.naturalHeight) < 0.01, `Deformed SVG: ${img.src}`);
  }
  for (const variant of ["primary", "secondary", "tertiary", "destructive"]) {
    for (const suffix of ["", "-disabled", "-loading"]) await readState(`#dark-${variant}${suffix}`, suffix || "default");
    const point = await position(`#dark-${variant}`);
    await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", ...point }); await delay(220);
    const hover = await readState(`#dark-${variant}`, "hover"); assert.ok(hover.hover);
    await cmd("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point }); await delay(180);
    const pressed = await readState(`#dark-${variant}`, "pressed"); assert.ok(pressed.active);
    await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
    await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 }); await delay(220);
  }
  for (const suffix of ["", "-disabled", "-loading"]) await readState(`#hc-destructive${suffix}`, suffix || "default");
  const hcPoint = await position("#hc-destructive");
  await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", ...hcPoint }); await delay(220);
  assert.ok((await readState("#hc-destructive", "hover")).hover);
  await cmd("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...hcPoint }); await delay(180);
  assert.ok((await readState("#hc-destructive", "pressed")).active);
  await screenshot("hc-destructive-pressed");
  await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...hcPoint });
  await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });

  await navigate("/pr02-design-preview");
  const order = [];
  for (let i = 0; i < 6; i++) {
    await key("Tab", "Tab", 9);
    order.push(await evaluate("document.activeElement.id"));
    const focused = await readState(`#${order[i]}`, "keyboard-focus");
    assert.ok(focused.focusVisible && focused.outlineWidth === "2px", "Missing visible keyboard focus");
    assert.ok(focused.focusContrast >= 3, "Focus indicator contrast against its surrounding gap");
  }
  assert.deepEqual(order, ["dark-primary", "dark-secondary", "dark-tertiary", "dark-destructive", "hc-destructive", "long-button"]);
  await key("Tab", "Tab", 9, 8);
  assert.equal(await evaluate("document.activeElement.id"), "hc-destructive", "Reverse Tab order");
  await screenshot("hc-destructive-keyboard-focus");
  const before = await count();
  for (const [index, [name, code, virtual]] of [["Enter", "Enter", 13], [" ", "Space", 32]].entries()) {
    await key(name, code, virtual);
    for (let retry = 0; retry < 20 && await count() < before + index + 1; retry++) await delay(50);
    assert.equal(await count(), before + index + 1, `${code} must activate a native button exactly once`);
  }
  for (const selector of ["#hc-destructive-disabled", "#hc-destructive-loading"]) {
    const point = await position(selector); const previous = await count();
    await cmd("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point });
    await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
    assert.equal(await count(), previous, "Disabled/loading activated");
  }
  report.keyboard = { order, reverseTab: true, enter: true, space: true, disabledBlocked: true, loadingBlocked: true, focusVisible: true };
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("/pr02-design-preview");
  const reduced = await readState("#dark-primary", "reduced-motion");
  assert.ok(reduced.transition.split(",").every((v) => v.trim() === "0s"));
  report.reducedMotion = true;
  await cmd("Emulation.setEmulatedMedia", { features: [] });
  await cmd("Emulation.setDeviceMetricsOverride", { width: 640, height: 844, deviceScaleFactor: 1, mobile: false });
  await navigate("/");
  await evaluate('document.documentElement.style.zoom = "2"');
  assert.ok(await evaluate("document.documentElement.scrollWidth <= innerWidth"));
  report.cssZoom200Reflow = true;
  report.nativeBrowserZoomManuallyVerified = false;
  report.resources = [...resources].filter((url) => /^https?:/.test(url));
  assert.ok(report.resources.every((url) => new URL(url).origin === origin), "External resource request");
  report.fontComparison = { figmaNode: "3:74", figmaLabelFrame: { width: 66, height: 20, weight: 500, size: 14, tracking: 0 }, note: "Frame bounds are not a font binary fingerprint. Compare measured text and screenshots; Figma binary version is unavailable." };
  report.passed = true;
  await writeFile(join(evidence, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`PASS: real browser responsive, original SVG geometry, rendered contrast, native hover/pressed/keyboard, reduced motion and same-origin resources. Evidence: ${evidence}`);
} finally {
  socket?.close();
  if (browser.exitCode === null) browser.kill();
  await delay(1000);
  assert.equal(dirname(resolve(profile)), resolve(tmpdir()), "Refuse cleanup outside the owned temporary parent");
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
}
