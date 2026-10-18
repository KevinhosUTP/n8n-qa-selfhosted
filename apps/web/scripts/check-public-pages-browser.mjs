// Optional local real-browser verification. Uses an already installed Chrome/Edge
// and Node's built-in WebSocket; installs no browser, package or test dependency.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const origin = process.argv[2];
assert.equal(new URL(origin).hostname, "127.0.0.1", "Only the owned local standalone server may be tested");
const evidence = resolve("../../.tools/pr04/browser");
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
const report = { browser: {}, sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), note: "Standalone browser evidence; this does not certify the Linux security artifact or integral WCAG conformance.", responsive: [], states: [], keyboard: {}, resources: [], images: [], typography: [] };
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
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") runtimeErrors.push(msg.params);
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

  const manifest = JSON.parse(await readFile("design-system/public-pages.json","utf8"));
  const routes = manifest.routes.map((route) => route.path);
  await cmd("Page.addScriptToEvaluateOnNewDocument", { source: `window.__pr04Metrics={cls:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__pr04Metrics.cls+=e.value}).observe({type:"layout-shift",buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.__pr04Metrics.lcp=e.startTime}).observe({type:"largest-contentful-paint",buffered:true});` });
  report.frames = [];
  report.performance = [];
  for (const width of [320,390,767,768,1023,1024,1440]) {
    const height=width===1440?900:width===768?1024:844;
    await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
    for (const route of routes) {
      await navigate(route);
      // Visit every section before a full-page capture; pending offscreen reveals
      // must never become blank bands in the evidence.
      await evaluate('(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.7){scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}scrollTo(0,0);})()');
      await delay(500);
      await until('[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0)', "Scrolled image did not load");
      const sample=await evaluate(`(()=>{
        const main=document.querySelector("main"),container=main.firstElementChild;
        const images=[...document.images].filter(i=>i.getClientRects().length).map(i=>({src:i.getAttribute("src"),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,loaded:i.complete&&i.naturalWidth>0}));
        return {route:location.pathname,width:innerWidth,viewport:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,mainCount:document.querySelectorAll("main").length,h1Count:document.querySelectorAll("h1").length,containerWidth:container.getBoundingClientRect().width,titleSize:getComputedStyle(document.querySelector("h1")).fontSize,titleLine:getComputedStyle(document.querySelector("h1")).lineHeight,headerHeight:document.querySelector("header").getBoundingClientRect().height,pending:document.querySelectorAll('[data-enter="pending"]').length,images,links:[...main.querySelectorAll("a")].map(a=>a.getAttribute("href")),disabled:[...main.querySelectorAll("button")].filter(b=>b.disabled).map(b=>b.textContent),metrics:window.__pr04Metrics,js:performance.getEntriesByType("resource").filter(e=>e.name.includes(".js")).map(e=>({url:e.name,bytes:e.transferSize,duration:e.duration}))};
      })()`);
      assert.equal(sample.overflow,false,`Overflow ${route} @${width}`);
      assert.equal(sample.mainCount,1);assert.equal(sample.h1Count,1);
      assert.equal(sample.headerHeight,width<1024?68:80);
      const gutter=width<768?Math.min(20,Math.max(16,0.05714286*width-2.285714)):32;
      assert.ok(Math.abs(sample.containerWidth-Math.min(1200,sample.viewport-2*gutter))<.2,"Public container changed");
      assert.equal(sample.titleSize,route==="/"?width<1024?"36px":"48px":width<1024?"32px":"40px");
      assert.equal(sample.pending,0,"Full-page evidence contains unrevealed content");
      assert.ok(sample.images.every(i=>i.loaded),"Missing visible image");
      for(const img of sample.images.filter(i=>i.src.startsWith("/public-content/"))) { assert.equal(img.width,24);assert.equal(img.height,24); }
      assert.ok(sample.links.every(href=>[...routes,"/sign-in","/sign-up"].includes(href)),"Unapproved CTA route");
      assert.ok(sample.metrics.cls<.1,`Layout instability: ${JSON.stringify(sample.metrics)}`);
      const contrast=await evaluate(`(()=>{
        const rgb=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number);
        const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
        const values=[...document.querySelectorAll("main p,main h1,main h2,main h3,main dt,main dd,main label,main summary,main input")].filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{
          let p=e;while(p&&getComputedStyle(p).backgroundColor==="rgba(0, 0, 0, 0)")p=p.parentElement;
          const a=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(p).backgroundColor));
          return {text:e.textContent.slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
        });
        return {count:values.length,minimum:Math.min(...values.map(x=>x.ratio)),failures:values.filter(x=>x.ratio<4.5)};
      })()`);
      assert.deepEqual(contrast.failures,[],`Effective text contrast ${route} @${width}`);
      sample.contrast=contrast;
      report.responsive.push(sample);
      if([320,390,768,1440].includes(width)) {
        const name=(route==="/"? "landing":route.slice(1).replaceAll("/","-"))+"-"+width;
        await shot(name);
        if(width===320||width===1440) {
          await evaluate("scrollTo(0,0)");
          await delay(100);
          const {data}=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
          await writeFile(join(evidence,name+"-viewport.png"),Buffer.from(data,"base64"));
        }
        report.frames.push({route,width,height,frame:Object.values(manifest.routes.find(r=>r.path===route).variants).find(v=>v.width===width).id,capture:name+".png"});
      }
      if(width===390) report.performance.push({route,metrics:sample.metrics,js:sample.js,note:"Controlled headless desktop browser emulation, not field/mobile performance"});
    }
  }
  await cmd("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate("/");
  const summary="main details:first-of-type summary";
  await evaluate('document.querySelector("main details summary").focus()');
  await key("Enter","Enter",13);
  assert.equal(await evaluate('document.querySelector("main details").open'),false);
  await key(" ","Space",32);
  assert.equal(await evaluate('document.querySelector("main details").open'),true);
  await key("Tab","Tab",9);
  assert.equal(await evaluate('document.activeElement.closest("details")===document.querySelectorAll("main details")[1]'),true);
  await key("Tab","Tab",9,8);
  await renderedContrast(summary,"focus");
  await shotElement("main details:first-of-type","faq-keyboard-focus");
  const {root} = await cmd("DOM.getDocument");
  const {nodeId} = await cmd("DOM.querySelector",{nodeId:root.nodeId,selector:summary});
  const ax=await cmd("Accessibility.getPartialAXTree",{nodeId});
  assert.ok(ax.nodes.some(n=>n.properties?.some(p=>p.name==="expanded"&&p.value.value===true)),"Native disclosure expanded state missing");
  report.faq={enter:true,space:true,tab:true,reverseTab:true,focusVisible:true,nativeExpandedState:true};
  await click('main a[href="/como-funciona"]');
  await until('location.pathname==="/como-funciona" && document.activeElement.id==="main-content"',"Public route focus failed");
  const backHistory=await cmd("Page.getNavigationHistory");
  await cmd("Page.navigateToHistoryEntry",{entryId:backHistory.entries[backHistory.currentIndex-1].id});
  await until('location.pathname==="/" && document.querySelector("#hero-title")?.dataset.hero==="complete"',"Hero replayed on client history back");
  await navigate("/");
  await click('main a[href="/sign-up"]');
  await until('location.pathname==="/sign-up" && document.querySelector("main")?.textContent.includes("Página no encontrada")',"Pending CTA did not reach honest 404");
  report.cta={realPublicNavigation:true,pendingSignup404:true,noPrivatePage:true};
  await navigate("/ayuda");
  await evaluate('document.querySelector("#help-query").focus()');
  await cmd("Input.insertText",{text:"LÍMITE archivo"});
  await key("Enter","Enter",13);
  await until('document.querySelector("[role=status]")?.textContent.includes("1 guía encontrada")',"Local search did not filter");
  assert.equal(await evaluate('document.querySelectorAll("main article").length'),1);
  await evaluate('document.querySelector("#help-query").value=""');
  // Native select-all/replace triggers React input events; no framework state injection.
  await evaluate('document.querySelector("#help-query").focus()');
  await key("a","KeyA",65,2);
  await cmd("Input.insertText",{text:"guia-que-no-existe"});
  await key("Enter","Enter",13);
  await until('document.querySelector("[role=status]")?.textContent.includes("0 guías encontradas")',"Empty result missing");
  await shotElement("main","help-empty-result");
  await evaluate('document.querySelector(\'form a[href="/ayuda"]\').focus()');
  await key("Enter","Enter",13);
  await until('document.querySelectorAll("main article").length===7',"Reset did not restore guides");
  assert.equal(await evaluate("document.activeElement.id"),"help-query","Clearing search lost keyboard focus");
  report.search={local:true,accentInsensitive:true,empty:true,reset:true,resetFocus:true,liveStatus:true};
  await navigate("/");
  const pendingReveals=await evaluate('document.querySelectorAll(\'[data-enter="pending"]\').length');
  assert.ok(pendingReveals>0,"Observer reveal was not prepared");
  await evaluate('document.querySelector(\'[data-enter="pending"]\').scrollIntoView()');
  await delay(600);
  assert.ok(await evaluate('document.querySelector(\'[data-enter="visible"]\')!==null'),"Observer did not reveal");
  const motor='main li img[src="/public-content/shield.svg"]';
  const pointerCapabilities=await evaluate('({fine:matchMedia("(pointer:fine)").matches,hover:matchMedia("(hover:hover)").matches})');
  const fineHover=pointerCapabilities.fine&&pointerCapabilities.hover;
  await evaluate(`document.querySelector('${motor}').scrollIntoView({block:"center"})`);
  await until(`document.querySelector('${motor}').closest("[data-enter]")?.dataset.enter!=="pending"`,"QA reveal did not start");
  // Settle the 480ms entry before measuring pointer coordinates. A fixed delay
  // after dispatch alone can race the browser's hit-testing/paint on Linux CI.
  await delay(500);
  const point=await evaluate(`(()=>{const r=document.querySelector('${motor}').closest("li").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",...point});
  await until(`document.querySelector('${motor}').closest("li").matches(":hover")`,"QA pointer missed card");
  const expectedMotorBorder=fineHover?"rgb(171, 141, 250)":"rgb(42, 45, 53)";
  await until(`getComputedStyle(document.querySelector('${motor}').closest("li")).borderColor===${JSON.stringify(expectedMotorBorder)}`,"QA pointer-appropriate paint did not settle");
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('${motor}').closest("li")).borderColor`),expectedMotorBorder);
  assert.ok(await evaluate('!document.querySelector(\'main li img[src="/public-content/shield.svg"]\').closest("li").hasAttribute("tabindex")'),"Informational card gained an artificial tab stop");
  report.motion={heroCss:true,observerFirstEntry:true,qaHover:fineHover,qaStaticFallback:!fineHover,pointerCapabilities,noninteractiveCards:true};
  await cmd("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
  assert.ok(await evaluate('matchMedia("(pointer:coarse)").matches&&!matchMedia("(hover:hover)").matches'),"Touch mode not established");
  await until(`getComputedStyle(document.querySelector('${motor}').closest("li")).borderColor==="rgb(42, 45, 53)"`,"Coarse pointer retained decorative QA hover");
  report.motion.emulatedCoarseStatic=true;
  await cmd("Emulation.setTouchEmulationEnabled",{enabled:false});
  await navigate("/precios");
  const planPoint=await evaluate('(()=>{const e=document.querySelector(\'article[aria-label="Plan Starter propuesto"]\');e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+40}})()');
  await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",...planPoint});
  await until('document.querySelector(\'article[aria-label="Plan Starter propuesto"]\').matches(":hover")',"Plan pointer missed card");
  const expectedPlanBackground=fineHover?"rgb(28, 31, 37)":"rgb(20, 22, 27)";
  await until(`getComputedStyle(document.querySelector('article[aria-label="Plan Starter propuesto"]')).backgroundColor===${JSON.stringify(expectedPlanBackground)}`,"Plan pointer-appropriate paint did not settle");
  assert.equal(await evaluate('getComputedStyle(document.querySelector(\'article[aria-label="Plan Starter propuesto"]\')).backgroundColor'),expectedPlanBackground);
  await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",x:1,y:1});await delay(200);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(\'article[aria-label="Plan Pro propuesto"]\')).borderColor'),"rgb(171, 141, 250)");
  assert.ok(await evaluate('[...document.querySelectorAll("main article button")].every(b=>b.disabled)'),"Plan CTA became operational");
  report.motion.planHover=fineHover;report.motion.planStaticFallback=!fineHover;report.motion.proRecommendationPersistent=true;
  console.log("PR04 pointer coverage:",JSON.stringify(report.motion));
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await navigate("/");
  assert.ok(await evaluate('[...document.querySelectorAll("h1 span,main details p")].every(e=>getComputedStyle(e).animationName==="none")'));
  assert.equal(await evaluate('document.querySelectorAll(\'[data-enter="pending"]\').length'),0);
  report.reducedMotion=true;
  await cmd("Emulation.setScriptExecutionDisabled",{value:true});
  report.noJavaScript=[];
  for(const route of routes) {
    await navigate(route);
    assert.ok(await evaluate('[...document.querySelectorAll("main [data-enter]")].every(e=>getComputedStyle(e).opacity==="1")'));
    assert.ok(await evaluate('document.querySelector("h1").getBoundingClientRect().height>0'));
    assert.ok(await evaluate('[...document.querySelectorAll("main section,main p,main h1,main h2")].every(e=>e.getClientRects().length>0&&getComputedStyle(e).opacity==="1")'),"Public content hidden without JavaScript");
    report.noJavaScript.push(route);
  }
  await navigate("/");
  await click(summary);
  assert.equal(await evaluate('document.querySelector("details").open'),false);
  await click(summary);
  assert.equal(await evaluate('document.querySelector("details").open'),true);
  await navigate("/ayuda");
  await evaluate('document.querySelector("#help-query").focus()');
  await cmd("Input.insertText",{text:"limite archivo"});
  await key("Enter","Enter",13);
  await until('location.search.includes("q=") && document.querySelector("[role=status]")?.textContent.includes("1 guía encontrada")',"GET search fallback without JavaScript failed");
  report.search.serverGetWithoutJavaScript=true;
  await click('form a[href="/ayuda"]');
  await until('location.search==="" && document.querySelectorAll("main article").length===7',"Clear link without JavaScript failed");
  report.search.resetWithoutJavaScript=true;
  await cmd("Emulation.setScriptExecutionDisabled",{value:false});
  for(const asset of manifest.assets) {
    const response=await fetch(origin+"/"+asset.path.replace(/^public\//,""));
    assert.equal(response.status,200);
    const {createHash}=await import("node:crypto");
    assert.equal(createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex"),asset.sha256);
  }
  for(const route of ["/sign-in","/sign-up"]) assert.equal((await fetch(origin+route)).status,404);
  report.resources=[...resources].filter(url=>/^https?:/.test(url));
  assert.ok(report.resources.every(url=>new URL(url).origin===origin),"Unexpected external resource");
  assert.deepEqual(runtimeErrors,[],"Browser console/runtime error");
  report.passed=true;
  await writeFile(join(evidence,"report.json"),JSON.stringify(report,null,2)+"\n");
  console.log(`PASS PR04: ${report.responsive.length} route/viewport samples, 32 frame captures, FAQ keyboard/AX, local and no-JS GET search, 8 no-JS pages, motion, CTA, resources and console. Evidence: ${evidence}`);
} finally {
  socket?.close();
  if(browser.exitCode===null)browser.kill();
  await delay(1000);
  assert.equal(dirname(resolve(profile)),resolve(tmpdir()),"Refuse cleanup outside owned temporary parent");
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:500});
}
