// Optional local real-browser verification. Uses an already installed Chrome/Edge
// and Node's built-in WebSocket; installs no browser, package or test dependency.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:3105";
assert.equal(new URL(origin).hostname, "127.0.0.1", "Only the owned local standalone server may be tested");
const evidence = resolve("../../.tools/pr05a/browser");
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
const report = { browser: {}, sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), note: "PR05a browser fixture evidence; this does not certify the Linux security artifact or integral WCAG conformance.", responsive: [], states: [], keyboard: {}, resources: [], images: [], typography: [] };
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
    const rect = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`);
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
    assert.ok(result.height >= 44, "Interactive target below product minimum");
    if (state === "focus") assert.ok(result.focus >= 3, "Focus contrast below 3:1");
    report.states.push(result);
  }

  const route = "/pr05a-shared-ui-preview";
  async function focus(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`); }
  async function replaceText(selector, value) {
    await focus(selector); await key("a", "KeyA", 65, 2);
    await cmd("Input.insertText", { text: value });
  }
  const observations = () => evaluate('JSON.parse(document.querySelector("#observations").textContent)');
  for (const width of [320, 390, 767, 768, 1023, 1024, 1440]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: false });
    await navigate(route);
    await evaluate('(async()=>{for(const i of document.images){i.scrollIntoView({block:"center"});await i.decode();}scrollTo(0,0);})()');
    const sample = await evaluate(`(()=>{
      const controls=[...document.querySelectorAll('input:not([type=checkbox],[type=radio]),select,button,a[href],label:has(input)')];
      return {width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
        controls:controls.map(e=>({id:e.id||e.htmlFor||e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),
        reportFont:getComputedStyle(document.querySelector('#report-select')).fontSize,
        images:[...document.images].map(i=>({src:new URL(i.src).pathname,w:i.width,h:i.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,complete:i.complete}))};
    })()`);
    if(sample.scrollWidth>sample.width) console.error(await evaluate('[...document.querySelectorAll("*")].filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,id:e.id,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(0,20)'));
    assert.ok(sample.scrollWidth <= sample.width, `Horizontal overflow at ${width}`);
    assert.ok(sample.controls.every(c=>c.width>=44 && c.height>=44), `Targets: ${JSON.stringify(sample.controls)}`);
    assert.equal(sample.reportFont, width===320?"12px":"14px");
    assert.ok(sample.images.every(i=>i.complete&&i.naturalWidth===i.w&&i.naturalHeight===i.h), "Original SVG slot geometry differs");
    for (const id of ["default-input", "error-input", "success-input", "readonly-input", "default-select", "error-select", "history-search", "history-select", "history-applied", "report-select", "report-applied"]) await renderedContrast(`#${id}`, "default");
    report.responsive.push(sample);
    if ([320,390,768,1440].includes(width)) {
      await shot(`shared-ui-${width}`);
      await shotElement('section[aria-labelledby="fields-title"]',`fields-${width}`);
      await shotElement('#native-form',`native-form-${width}`);
      await shotElement('#feedback',`feedback-${width}`);
      await shotElement('#filters',`filters-${width}`);
    }
    const feedbackContrast=await evaluate(`(()=>{
      const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const rgb=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      return [...document.querySelectorAll('#feedback span[data-tone],#feedback p,#feedback h2,#feedback h3,#feedback div')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.closest('button')).map(e=>{let p=e;while(p&&getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)')p=p.parentElement;return{text:e.textContent.slice(0,80),ratio:ratio(rgb(getComputedStyle(e).color),rgb(getComputedStyle(p).backgroundColor))};});
    })()`);
    assert.ok(feedbackContrast.length>=12 && feedbackContrast.every(v=>v.ratio>=4.5),JSON.stringify(feedbackContrast));
    sample.feedbackContrast=feedbackContrast;
  }
  await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await navigate(route);
  // Check every interactive family with actual keyboard modality, including links.
  await key("Tab", "Tab", 9);
  for(const selector of ["#default-input","#default-select","#history-search","#history-select","#report-select","#text-link"]){
    await focus(selector); await renderedContrast(selector,"focus");
    assert.equal(await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).outlineWidth`),"2px");
  }
  for(const selector of ["#native-check","#native-switch","#native-radio-a"]){
    await focus(selector);
    const state=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);return{outline:s.outlineWidth,color:s.outlineColor,target:e.closest('label').getBoundingClientRect().height}})()`);
    assert.equal(state.outline,"2px");assert.equal(state.color,"rgb(171, 141, 250)");assert.ok(state.target>=44);
  }
  // Real key/pointer events verify React wiring and native behavior, not just attributes.
  await focus("#default-input"); await key("Tab", "Tab", 9);
  assert.equal(await evaluate('document.activeElement.id'), "error-input");
  await renderedContrast("#error-input", "focus");
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineWidth'), "2px");
  await shotElement('label[for="error-input"]', "input-label");
  await key("Tab", "Tab", 9);
  assert.equal(await evaluate('document.activeElement.id'), "success-input", "Disabled input must not be tabbable");
  await replaceText("#readonly-input", "Cambio");
  assert.equal(await evaluate('document.querySelector("#readonly-input").value'), "Lectura");
  await focus("#native-check"); await key(" ", "Space", 32);
  assert.equal(await evaluate('document.querySelector("#native-check").checked'), true);
  await click('label[for="native-check"]');
  assert.equal(await evaluate('document.querySelector("#native-check").checked'), false);
  await focus("#native-switch"); await key(" ", "Space", 32);
  assert.equal(await evaluate('document.querySelector("#native-switch").checked'), false);
  await focus("#native-radio-a"); await key("ArrowRight", "ArrowRight", 39);
  assert.equal(await evaluate('document.querySelector("#native-radio-b").checked'), true);
  await focus("#native-select"); await key("ArrowDown", "ArrowDown", 40); await key("Enter", "Enter", 13);
  await until('document.querySelector("#native-select").value==="two"', "Native keyboard select failed");
  await replaceText("#native-input", ""); await key("Backspace", "Backspace", 8);
  await click("#submit");
  assert.equal((await observations()).submits,0);
  assert.equal(await evaluate('document.activeElement.id'), "native-input", "Required validation focus");
  await cmd("Input.insertText", { text: "Valor válido" });
  await click("#submit"); await until('JSON.parse(document.querySelector("#observations").textContent).submits===1', "Submit callback failed");
  assert.equal(await evaluate('new FormData(document.querySelector("#native-form")).get("native")'), "Valor válido");
  await click("#reset");
  assert.deepEqual(await evaluate('({text:document.querySelector("#native-input").value,select:document.querySelector("#native-select").value,check:document.querySelector("#native-check").checked,switch:document.querySelector("#native-switch").checked,radio:document.querySelector("#native-radio-a").checked})'), {text:"Inicial",select:"one",check:false,switch:true,radio:true});
  await click("#disabled-check"); assert.equal(await evaluate('document.querySelector("#disabled-check").checked'),false);
  await replaceText("#controlled-input", "Editado");
  await focus("#controlled-select"); await key("ArrowDown", "ArrowDown", 40); await key("Enter", "Enter", 13);
  await click("#controlled-check");
  await focus("#controlled-radio-a"); await key("ArrowRight", "ArrowRight", 39);
  await until('JSON.parse(document.querySelector("#observations").textContent).radio==="b"', "Controlled radio event failed");
  const controlled = await observations();
  assert.equal(controlled.text,"Editado"); assert.equal(controlled.select,"two"); assert.equal(controlled.checked,true);
  assert.equal(await evaluate('document.querySelector("#controlled-switch").checked'),true);
  await click("#controlled-reset");
  await until('JSON.parse(document.querySelector("#observations").textContent).text==="Controlado"', "Consumer-owned reset failed");
  assert.equal((await observations()).checked,false); assert.equal((await observations()).radio,"a");
  assert.ok((await observations()).changes>=3);
  const ax=await cmd("Accessibility.getFullAXTree");
  for (const [role,name] of [["textbox","Correo electrónico"],["combobox","Selector de opción"],["checkbox","Sin seleccionar"],["switch","Preferencia de ejemplo"],["radio","Opción A"]]) {
    assert.ok(ax.nodes.some(n=>n.role?.value===role&&n.name?.value===name), `AX name/role missing: ${role}/${name}`);
  }
  assert.ok(ax.nodes.some(n=>n.role?.value==="status"), "Explicit status region missing");
  await click("#announce"); await until('document.querySelector(\'[role="status"]\').textContent.includes("Mensaje actualizado")', "Live region content did not update");
  assert.equal(await evaluate('document.activeElement.id'), "announce", "Alert stole focus");
  const disabledLink=await evaluate('(()=>{const e=[...document.querySelectorAll("span[aria-disabled]")].at(-1);return{href:e.getAttribute("href"),tabIndex:e.tabIndex}})()');
  assert.deepEqual(disabledLink,{href:null,tabIndex:-1});
  await focus("#text-link"); await key("Enter", "Enter", 13);
  await until('location.hash==="#fixture-main"', "TextLink did not navigate");
  report.keyboard={tab:true,disabledSkipped:true,focusVisible:true,readonly:true,choiceSpace:true,labelClick:true,radioArrows:true,selectKeyboard:true,required:true,nativeSubmit:true,nativeReset:true,controlled:true,consumerOwnedReset:true,events:true,textLink:true,alertDidNotStealFocus:true,axRolesAndNames:true};
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await navigate(route);
  assert.equal(await evaluate('[...document.querySelectorAll("main input,main select,main button,main [aria-hidden=true]")].every(e=>getComputedStyle(e).animationName==="none"&&getComputedStyle(e).transitionDuration.split(",").every(v=>v.trim()==="0s"))'),true);
  report.reducedMotion=true;
  await cmd("Emulation.setDeviceMetricsOverride",{width:320,height:320,deviceScaleFactor:1,mobile:false});
  await navigate(route); assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await focus("#report-select"); assert.equal(await evaluate('document.activeElement.id'),"report-select");
  report.shortViewport=true;
  await cmd("Emulation.setDeviceMetricsOverride",{width:640,height:844,deviceScaleFactor:1,mobile:false});
  await navigate(route); await evaluate('document.documentElement.style.zoom="2"');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  report.cssZoom200Reflow=true;
  await cmd("Emulation.setScriptExecutionDisabled",{value:true});
  await cmd("Page.navigate",{url:origin+route}); await delay(2000);
  await cmd("Emulation.setScriptExecutionDisabled",{value:false});
  assert.equal(await evaluate('!!document.querySelector("label[for=default-input]")&&document.querySelectorAll("select option").length>10'),true);
  report.ssrContentPresentWithoutJavaScript=true;
  report.resources=[...resources].filter(url=>/^https?:/.test(url));
  assert.ok(report.resources.every(url=>new URL(url).origin===origin),"External resource request");
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  report.axe="pending-not-installed";
  report.manualPending=["screen readers","physical devices","Safari/Firefox","native browser-menu zoom","exhaustive WCAG audit"];
  report.passed=true;
  await writeFile(join(evidence,"report.json"),`${JSON.stringify(report,null,2)}\n`);
  console.log(`PASS PR05a: ${report.responsive.length} viewports; native form, controlled/uncontrolled/reset, keyboard/AX, contrast, SVG geometry and reduced motion. Axe pending. Evidence: ${evidence}`);
} finally {
  socket?.close();
  if(browser.exitCode===null)browser.kill();
  await delay(1000);
  assert.equal(dirname(resolve(profile)),resolve(tmpdir()),"Refuse cleanup outside owned temporary parent");
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:500});
}
