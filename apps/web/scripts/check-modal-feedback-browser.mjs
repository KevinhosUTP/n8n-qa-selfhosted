// Optional local real-browser verification. Uses an already installed Chrome/Edge
// and Node's built-in WebSocket; installs no browser, package or test dependency.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { verifyChoiceAccessibility } from "./check-choice-accessibility.mjs";

const origin = "http://127.0.0.1:3106";
assert.equal(new URL(origin).hostname, "127.0.0.1", "Only the owned local standalone server may be tested");
const evidence = resolve("../../.tools/pr05b/browser");
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
const report = { browser: {}, sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), note: "PR05b browser fixture evidence; this does not certify the Linux security artifact or integral WCAG conformance.", responsive: [], states: [], keyboard: {}, resources: [], images: [], typography: [] };
report.workingTreeDirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
report.renderedSourceHashes = {};
for (const path of execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "src/components", "src/styles", "tests/fixtures/modal-feedback-preview.tsx", "scripts/check-choice-accessibility.mjs", "scripts/check-modal-feedback-browser.mjs", "design-system/choice-accessibility.json"], { encoding: "utf8" }).split("\0").filter(Boolean)) {
  report.renderedSourceHashes[path] = createHash("sha256").update(await readFile(path)).digest("hex");
}
try {
  let port;
  for (let i = 0; i < 300; i++) {
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
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") runtimeErrors.push(msg.params);
    if (msg.method === "Runtime.exceptionThrown") runtimeErrors.push(msg.params.exceptionDetails);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") runtimeErrors.push(msg.params.args.map(a=>a.value??a.description));
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
    console.error(JSON.stringify({ message, runtimeErrors, state: await evaluate('({active:document.activeElement?.tagName,path:location.pathname,trigger:document.querySelector(\'[aria-label="Abrir menú"]\')?.getAttribute("aria-expanded"),open:!!document.querySelector("dialog[open]"),finePointer:matchMedia("(pointer:fine)").matches,canHover:matchMedia("(hover:hover)").matches,hoveredCards:[...document.querySelectorAll("main li:hover,main article:hover")].map(e=>({text:e.textContent.slice(0,80),border:getComputedStyle(e).borderColor,background:getComputedStyle(e).backgroundColor}))})') }));
    assert.fail(message);
  }
  async function navigate(path) {
    await evaluate('window.__kevolintTestDocument = true');
    await cmd("Page.navigate", { url: `${origin}${path}` });
    await until(`!window.__kevolintTestDocument && location.pathname + location.search === ${JSON.stringify(path)}`, `New document not committed: ${path}`);
    await until('document.readyState === "complete" && !!document.querySelector("main") && document.fonts.status === "loaded" && [...document.images].filter(i=>i.getClientRects().length&&i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0).every(i=>i.complete && i.naturalWidth>0)', `Page not ready: ${path}`);
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
    if (name.startsWith("choice-") && name.includes("-focus-")) {
      // Preserve the native focused viewport: resizing it to a short clip can
      // scroll the focused input again and cut off the measured section title.
      await evaluate(`(async()=>{document.querySelector('nextjs-portal')?.remove();document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
      const { data } = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(join(evidence, `${name}.png`), Buffer.from(data, "base64"));
      return;
    }
    // Remove only Next development tooling from evidence, never application UI.
    await evaluate('document.querySelector("nextjs-portal")?.remove();scrollTo({top:0,left:0,behavior:"instant"})');
    const rect = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:0,y:r.y+scrollY,width:innerWidth,height:r.height}})()`);
    // Keep the viewport width during capture so wrapping cannot shift the
    // document relative to a previously measured, narrower element clip.
    const { data } = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...rect, scale: 1 } });
    await writeFile(join(evidence, `${name}.png`), Buffer.from(data, "base64"));
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
    if (!selector.endsWith("h2")) assert.ok(result.height >= 44, "Interactive target below product minimum");
    if (state === "focus") assert.ok(result.focus >= 3, "Focus contrast below 3:1");
    report.states.push(result);
  }

  const route = "/pr05b-modal-feedback-preview";
  const focus = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  const requests = () => evaluate('JSON.parse(document.querySelector("#close-requests").textContent)');
  async function open(kind) {
    await click(`#open-${kind}`);
    await until('document.querySelector("#shared-modal").matches(":modal")', "Modal did not open");
  }
  async function closed() {
    await until('!document.querySelector("dialog[open]") && document.body.style.position !== "fixed"', "Modal did not close and restore scroll");
    assert.notEqual(await evaluate('document.body.style.position'), "fixed", "Scroll lock leaked");
  }
  async function escape() { await key("Escape", "Escape", 27); await closed(); }
  for (const width of [320, 390, 767, 768, 1023, 1024, 1440]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: false });
    await navigate(route);
    await evaluate('(async()=>{for(const i of document.images){if(i.getClientRects().length){i.scrollIntoView({block:"center"});await i.decode();}}scrollTo(0,0)})()');
    const sample = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})');
    if(sample.scrollWidth>sample.clientWidth)console.error(await evaluate('[...document.querySelectorAll("main *")].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth).map(e=>({tag:e.tagName,id:e.id,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(0,12)'));
    assert.ok(sample.scrollWidth <= sample.clientWidth, `Fixture overflow at ${width}`);
    for (const kind of ["dialog", "drawer", "form"]) {
      await open(kind);
      const geometry = await evaluate(`(()=>{const d=document.querySelector('#shared-modal'),p=d.firstElementChild,r=p.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,bottom:r.bottom,overflow:p.scrollWidth>p.clientWidth,font:getComputedStyle(p.querySelector('h2')).fontFamily,background:getComputedStyle(p).backgroundColor,animation:getComputedStyle(p).animationName,targets:[...p.querySelectorAll('button,select,input:not([type=radio],[type=checkbox]),label:has(input)')].filter(e=>e.getClientRects().length).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))};})()`);
      assert.ok(!geometry.overflow && geometry.left >= 0 && geometry.right <= width && geometry.bottom <= 844, JSON.stringify(geometry));
      assert.ok(geometry.targets.every(t=>t.w>=44 && t.h>=44), JSON.stringify(geometry.targets));
      assert.equal(geometry.animation,"none");
      const ax = await cmd("Accessibility.getFullAXTree");
      assert.ok(ax.nodes.some(n=>n.role?.value==="dialog" && n.name?.value===(kind==="drawer"?"Filtros del historial":"Diálogo de demostración")),"Accessible modal name missing");
      await renderedContrast("#shared-modal h2","default");
      if(kind!=="form")await renderedContrast("#modal-close","default");
      sample[kind] = geometry;
      if([320,390,768,1440].includes(width))await shotElement("#shared-modal > div",`${kind}-${width}`);
      await escape();
      assert.equal((await requests()).at(-1).reason,"escape");
      assert.equal(await evaluate('document.activeElement.id'),`open-${kind}`);
    }
    const toastContrast=await evaluate(`(()=>{
      const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const rgb=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number);
      return [...document.querySelectorAll('[data-tone]')].filter(e=>e.closest('#toast-samples')).map(e=>{const a=lum(rgb(getComputedStyle(e.querySelector('p')).color)),b=lum(rgb(getComputedStyle(e).backgroundColor));return {tone:e.dataset.tone,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),width:e.getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth,icon:[e.querySelector('img').naturalWidth,e.querySelector('img').naturalHeight]};});})()`);
    assert.ok(toastContrast.length===5 && toastContrast.every(t=>t.ratio>=4.5&&!t.overflow&&t.icon.every(v=>v===24)),JSON.stringify(toastContrast));
    sample.toast=toastContrast;
    sample.booleans=await evaluate(`['review-checkbox-off','review-checkbox-on','review-switch-off','review-switch-on'].map(id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return {id,checked:e.checked,background:s.backgroundColor,image:s.backgroundImage,border:s.border,box:{width:r.width,height:r.height},labelHeight:e.closest('label').getBoundingClientRect().height};})`);
    assert.ok(sample.booleans.every(e=>e.labelHeight>=44));
    if([320,390,768,1440].includes(width)){
      await shotElement('#toast-samples',`toast-${width}`);
      await shotElement('#boolean-review',`boolean-off-on-${width}`);
      await key("Tab","Tab",9);
      await focus('#review-checkbox-on');
      assert.equal(await evaluate('document.activeElement.matches(":focus-visible")'),true);
      await shotElement('#boolean-review',`boolean-checkbox-focus-${width}`);
      await focus('#review-switch-on');
      await shotElement('#boolean-review',`boolean-switch-focus-${width}`);
    }
    report.responsive.push(sample);
  }
  await verifyChoiceAccessibility({ cmd, evaluate, navigate, route, key, click, focus, until, shotElement, report });
  await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await navigate(route);
  await focus('#open-concurrent'); await key("Enter","Enter",13);
  await until('document.activeElement.id==="shared-modal-title"',"Initial heading focus missing");
  await key("Tab","Tab",9);
  assert.equal(await evaluate('document.activeElement.id'),"open-second");
  await focus('#modal-close'); await key("Tab","Tab",9);
  assert.equal(await evaluate('document.activeElement.id'),"open-second","Forward boundary escaped");
  await key("Tab","Tab",9,8);
  assert.equal(await evaluate('document.activeElement.id'),"modal-close","Reverse boundary escaped");
  assert.equal(await evaluate('document.activeElement.matches(":focus-visible")'),true);
  await renderedContrast('#modal-close','focus');
  await evaluate('document.querySelector("#open-dialog").focus()');
  assert.ok(await evaluate('!!document.activeElement.closest("dialog")'),"Background not inert");
  await click('#open-second');
  await until('document.querySelector("#close-requests").textContent.includes("open-rejected")',"Second modal not rejected");
  assert.equal(await evaluate('document.querySelectorAll("dialog:modal").length'),1);
  assert.equal(await evaluate('document.activeElement.id'),"open-second");
  assert.equal(await evaluate('document.body.style.position'),"fixed");
  await click('#modal-close'); await closed();
  assert.equal((await requests()).at(-1).reason,"button");
  await open('dialog');
  // A real pointer gesture on the scrim, outside the panel.
  for(const type of ['mousePressed','mouseReleased'])await cmd('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,x:2,y:2});
  await closed(); assert.equal((await requests()).at(-1).reason,"scrim");
  await open('denied'); await key("Escape","Escape",27);
  assert.equal((await requests()).at(-1).reason,"escape");
  assert.ok(await evaluate('document.querySelector("#shared-modal").matches(":modal")'),"Consumer denial lost modal");
  await evaluate('document.querySelector("#shared-modal").close("declined")');
  await until('document.querySelector("#shared-modal").matches(":modal") && document.querySelector("#close-requests").textContent.includes("native")',"Declined native close did not reconcile");
  await click('#allow-close'); await click('#modal-close'); await closed();
  await open('empty');
  await key("Tab","Tab",9); await key("Tab","Tab",9,8);
  assert.ok(await evaluate('!!document.activeElement.closest("#shared-modal")'),"Empty modal focus escaped");
  await escape();
  // Native form validation, reset, grouping and method=dialog with controlled state.
  await open('form');
  assert.equal(await evaluate('document.activeElement.id'),"modal-name");
  await click('#modal-submit');
  assert.equal(await evaluate('document.activeElement.id'),"modal-name");
  assert.deepEqual(await requests(),[]);
  await cmd('Input.insertText',{text:'Muestra'});
  await key("Tab","Tab",9); assert.equal(await evaluate('document.activeElement.id'),"modal-readonly");
  await key("Tab","Tab",9); assert.equal(await evaluate('document.activeElement.id'),"modal-select");
  await key("Tab","Tab",9); assert.equal(await evaluate('document.activeElement.id'),"modal-radio-a");
  await key("ArrowRight","ArrowRight",39); assert.equal(await evaluate('document.querySelector("#modal-radio-b").checked'),true);
  await key("Tab","Tab",9); assert.equal(await evaluate('document.activeElement.id'),"modal-checkbox");
  await focus('#modal-close'); await key("Tab","Tab",9);
  assert.equal(await evaluate('document.activeElement.id'),"modal-name");
  await key("Tab","Tab",9,8); assert.equal(await evaluate('document.activeElement.id'),"modal-close");
  await click('#modal-reset'); assert.equal(await evaluate('document.querySelector("#modal-name").value'),"");
  await focus('#modal-name'); await cmd('Input.insertText',{text:'Revisión'});
  await click('#prevent-submit'); await click('#modal-submit');
  assert.ok(await evaluate('document.querySelector("#shared-modal").matches(":modal")'));
  assert.deepEqual(await requests(),[]);
  await click('#prevent-submit'); await click('#modal-submit'); await closed();
  assert.deepEqual((await requests()).at(-1),{reason:'form',returnValue:'reviewed'});
  assert.equal(await evaluate('document.querySelector("#form-result").textContent'),'Revisión');
  await open('form');
  await cmd('Input.insertText',{text:'Método explícito'});
  await evaluate('document.querySelector("#native-modal-form").method="get"');
  await click('#modal-submit-override'); await closed();
  assert.deepEqual((await requests()).at(-1),{reason:'form',returnValue:'overridden'});
  // Native external close reconciles controlled state; the normal route uses requests.
  await open('dialog'); await evaluate('document.querySelector("#shared-modal").close("native-value")'); await closed();
  assert.deepEqual((await requests()).at(-1),{reason:'native',returnValue:'native-value'});
  // Exact prior inline priorities, styles and scroll survive unmount and remount.
  await evaluate('document.body.style.setProperty("overflow","scroll","important");document.body.style.position="relative";scrollTo(0,400)');
  const before=await evaluate('({style:document.body.getAttribute("style"),x:scrollX,y:scrollY})');
  await evaluate('document.querySelector("#open-dialog").click()');
  await until('document.querySelector("#shared-modal").matches(":modal")',"Unmount sample did not open");
  await evaluate('document.querySelector("#unmount-modal").click()'); await closed();
  assert.deepEqual(await evaluate('({style:document.body.getAttribute("style"),x:scrollX,y:scrollY})'),before);
  await evaluate('document.body.removeAttribute("style");scrollTo(0,0)');
  await open('dialog'); await escape();
  // Removal of the initiating control must not throw or leak focus into inert content.
  await open('dialog'); await evaluate('document.querySelector("#open-dialog").remove()'); await escape();
  assert.equal(await evaluate('document.activeElement.id'),'main-content',"Caller-provided fallback focus missing");
  await navigate(route);
  await cmd("Emulation.setDeviceMetricsOverride", { width: 320, height: 320, deviceScaleFactor: 1, mobile: false });
  await open('long');
  const limited=await evaluate('(()=>{const p=document.querySelector("#shared-modal > div"),r=p.getBoundingClientRect();return {scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,height:r.height,top:r.top,bottom:r.bottom}})()');
  assert.ok(limited.scrollHeight>limited.clientHeight&&limited.scrollWidth<=limited.clientWidth,JSON.stringify(limited));
  await evaluate('document.querySelector("#modal-close").scrollIntoView()');
  assert.ok(await evaluate('(()=>{const r=document.querySelector("#modal-close").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()'));
  await shotElement('#shared-modal > div','dialog-short-height-320');
  await click('#modal-close'); await closed();
  await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await open('drawer'); await escape();
  await cmd('Emulation.setEmulatedMedia',{features:[]});
  await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await navigate(route);
  // A stable status surface precedes the event; rerendering the same event mutates nothing.
  await evaluate('window.__region=document.querySelector("[data-toast-region]");window.__mutations=0;window.__observer=new MutationObserver(v=>window.__mutations+=v.length);window.__observer.observe(window.__region,{childList:true,subtree:true,characterData:true})');
  await click('#toast-update');
  await until('document.querySelector("[data-toast-region]").textContent.includes("Mensaje de prueba")',"Toast did not update");
  assert.equal(await evaluate('document.activeElement.id'),'toast-update');
  assert.equal(await evaluate('window.__region===document.querySelector("[data-toast-region]")'),true);
  assert.equal(await evaluate('document.querySelectorAll("[data-toast-region] [role]").length'),0);
  const mutationCount=await evaluate('window.__mutations');
  await click('#toast-rerender'); await delay(50);
  assert.equal(await evaluate('window.__mutations'),mutationCount,"Same event duplicated announcement DOM");
  await delay(1200); assert.ok(await evaluate('window.__region.textContent.includes("Mensaje de prueba")'),"Unexpected auto-dismiss");
  await click('#toast-clear'); await until('!window.__region.textContent',"Caller removal failed");
  await shot('modal-feedback-overview');
  report.keyboard={modalBoundary:true,forms:true,emptyContent:true,backgroundInert:true};
  report.lifecycle={closeReasons:true,controlledDenial:true,simultaneousRejected:true,nativeForm:true,externalClose:true,exactScrollRestore:true,unmount:true,remount:true,removedTrigger:true,shortViewport:true,reducedMotion:true};
  report.toast={stableRegion:true,singleAnnouncementSurface:true,sameEventNoMutation:true,noFocusTheft:true,callerRemoval:true,noAutoDismissObserved:true,screenReaderAnnouncement:'NOT_RUN'};
  report.resources=[...resources].filter(u=>/^https?:/.test(u));
  assert.ok(report.resources.every(u=>new URL(u).origin===origin),'Unexpected external resource');
  assert.deepEqual(runtimeErrors,[],JSON.stringify(runtimeErrors));
  report.axe='alternative-A-selected-installation-not-authorized';
  report.manualPending=['screen reader announcements','native browser zoom','Safari/Firefox','physical touch devices','integral WCAG evaluation'];
  report.passed=true;
  await writeFile(join(evidence,'report.json'),`${JSON.stringify(report,null,2)}\n`);
  console.log(`PASS PR05b: ${report.responsive.length} viewports, native modal/form/focus/scroll lifecycle, Toast region and original assets. Axe pending. Evidence: ${evidence}`);
} finally {
  socket?.close();
  if(browser.exitCode===null)browser.kill();
  await delay(1000);
  assert.equal(dirname(resolve(profile)),resolve(tmpdir()),"Refuse cleanup outside owned temporary parent");
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:500});
}
