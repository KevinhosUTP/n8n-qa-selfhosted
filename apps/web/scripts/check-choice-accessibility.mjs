// Runs inside the existing PR05b browser suite on Windows and Linux.
// Evaluates actual component styles, original SVG fills, geometry and native state.
import assert from "node:assert/strict";

export async function verifyChoiceAccessibility({ cmd, evaluate, navigate, route, key, click, focus, until, shotElement, report }) {
  const results = { responsive: [], interactions: {}, scope: "Effective component evidence, not axe or integral WCAG certification" };
  const measure = () => evaluate(`(async()=>{
    const rgb=c=>{if(c.startsWith('#'))return c.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(1);const a=c.match(/[\\d.]+/g).map(Number);return a.length===3?[...a,1]:a;};
    const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
    const backdrop=e=>{for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c[3]===1)return c;if(c[3]!==0)throw Error('Unqualified translucent backdrop');}throw Error('No opaque backdrop');};
    const svgColors={};
    for(const state of ['off','on']){const u=new URL('/shared-ui/switch-'+state+'.svg',location.origin),r=await fetch(u);if(!r.ok)throw Error('Missing original switch SVG');const doc=new DOMParser().parseFromString(await r.text(),'image/svg+xml'),p=doc.querySelector('path');if(!p||doc.querySelector('parsererror')||(p.getAttribute('fill-opacity')??'1')!=='1')throw Error('Unexpected SVG fill');svgColors[state]=rgb(p.getAttribute('fill'));}
    const controls=[...document.querySelectorAll('#boolean-review input,#choice-state-review input')];
    return controls.map(e=>{
      const label=e.closest('label'),layer=e.nextElementSibling,s=getComputedStyle(e),p=getComputedStyle(layer,'::before'),outline=getComputedStyle(layer,'::after'),r=e.getBoundingClientRect(),w=e.parentElement.getBoundingClientRect(),isSwitch=e.getAttribute('role')==='switch',bg=backdrop(label),fill=isSwitch?svgColors[e.checked?'on':'off']:rgb(s.backgroundColor),graphic=rgb(p.backgroundColor);
      const ancestors=[];for(let a=layer;a;a=a.parentElement){const q=getComputedStyle(a);ancestors.push({opacity:q.opacity,filter:q.filter,blend:q.mixBlendMode,visibility:q.visibility});}
      return {id:e.id,kind:isSwitch?'switch':'checkbox',checked:e.checked,disabled:e.matches(':disabled'),invalid:e.getAttribute('aria-invalid'),describedBy:e.getAttribute('aria-describedby'),width:r.width,height:r.height,wrapper:[w.width,w.height],target:[label.getBoundingClientRect().width,label.getBoundingClientRect().height],decorationHidden:layer.getAttribute('aria-hidden'),decorationPointer:getComputedStyle(layer).pointerEvents,decorationTabIndex:layer.tabIndex,layerDisplay:getComputedStyle(layer).display,display:p.display,marker:[parseFloat(p.left),parseFloat(p.top),parseFloat(p.width),parseFloat(p.height)],mask:p.maskImage,image:s.backgroundImage,background:fill,foreground:graphic,graphicContrast:e.checked||isSwitch?ratio(graphic,fill):null,controlBorderContrast:ratio(rgb(s.borderColor),bg),outlineContrast:ratio(rgb(outline.borderColor),bg),textContrast:ratio(rgb(getComputedStyle(label).color),bg),pseudoOpacity:p.opacity,pseudoVisibility:p.visibility,outlineOpacity:outline.opacity,focus:s.outlineStyle!=='none'?{width:s.outlineWidth,offset:s.outlineOffset,contrast:ratio(rgb(s.outlineColor),bg)}:null,ancestors,animation:p.animationName,transition:p.transitionDuration};
    });
  })()`);
  function validate(samples) {
    assert.equal(samples.length, 22);
    for (const s of samples) {
      assert.equal(s.width, s.kind === "switch" ? 40 : 20, s.id);
      assert.equal(s.height, 20, s.id);
      assert.deepEqual(s.wrapper, [s.width, 20], s.id);
      assert.ok(s.target.every(v => v >= 44), s.id);
      assert.equal(s.decorationHidden, "true");
      assert.equal(s.decorationPointer, "none");
      assert.equal(s.decorationTabIndex, -1);
      assert.notEqual(s.layerDisplay, "none");
      assert.equal(s.pseudoOpacity, "1");
      assert.equal(s.pseudoVisibility, "visible");
      assert.ok(s.ancestors.every(a => a.opacity === "1" && a.filter === "none" && a.blend === "normal" && a.visibility === "visible"), s.id);
      assert.equal(s.animation, "none");
      assert.equal(s.transition, "0s");
      assert.ok(s.textContrast >= 4.5, s.id);
      if (s.kind === "switch") {
        assert.deepEqual(s.marker, [s.checked ? 24 : 4, 4, 12, 12], s.id);
        assert.ok(s.image.includes(s.checked ? "switch-on.svg" : "switch-off.svg"));
        assert.ok(s.outlineContrast >= 3, s.id);
        assert.equal(s.outlineOpacity, "1");
      } else {
        assert.ok(s.controlBorderContrast >= 3, s.id);
        assert.equal(s.display, s.checked ? "block" : "none", s.id);
        if (s.checked) {
          assert.deepEqual(s.marker, [2, 2, 16, 16]);
          assert.ok(s.mask.includes("check-16.svg"));
        }
      }
      if (s.checked || s.kind === "switch") assert.ok(s.graphicContrast >= 3, JSON.stringify(s));
      if (s.id.endsWith("-error")) {
        assert.equal(s.invalid, "true");
        assert.equal(s.describedBy, `${s.id}-hint ${s.id}-error`);
      }
      if (s.id.includes("-disabled-")) assert.equal(s.disabled, true);
    }
  }
  for (const width of [320, 390, 767, 768, 1023, 1024, 1440]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: false });
    await navigate(route);
    assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
    const samples = await measure(); validate(samples);
    const focusedSamples = [];
    const selectors = ["#review-checkbox-off", "#review-checkbox-on", "#review-switch-off", "#review-switch-on",
      ...["background", "surface", "raised"].flatMap(surface => ["checkbox", "switch"].map(kind => `#choice-${surface}-${kind}-error`))];
    for (const selector of selectors) {
      await key("Tab", "Tab", 9); await focus(selector);
      assert.equal(await evaluate("document.activeElement.matches(':focus-visible')"), true);
      const focusedStates = await measure(); validate(focusedStates);
      const focused = focusedStates.find(s => `#${s.id}` === selector);
      assert.deepEqual([focused.focus.width, focused.focus.offset], ["2px", "2px"]);
      assert.ok(focused.focus.contrast >= 3 && (focused.graphicContrast === null || focused.graphicContrast >= 3));
      focusedSamples.push(focused);
      if ([320, 390, 768, 1440].includes(width) && ["#review-checkbox-on", "#review-switch-on"].includes(selector)) await shotElement("#boolean-review", `choice-${focused.kind}-focus-${width}`);
    }
    if ([320, 390, 768, 1440].includes(width)) await shotElement("#choice-state-review", `choice-surfaces-disabled-errors-${width}`);
    results.responsive.push({ width, samples, focusedSamples, focusedSignalsVisible: true });
  }
  await navigate(route);
  await evaluate("window.__choiceNativeChanges=0;window.__referenceNativeChanges=0;document.querySelector('#choice-review-form').addEventListener('change',()=>window.__choiceNativeChanges++);document.querySelector('#native-choice-reference').addEventListener('change',()=>window.__referenceNativeChanges++)");
  const values = () => evaluate("[...new FormData(document.querySelector('#choice-review-form')).entries()]");
  const initial = [["checkbox-on", "yes"], ["switch-on", "yes"]];
  assert.deepEqual(await values(), initial);
  await focus("#review-checkbox-off"); await key(" ", "Space", 32);
  assert.equal((await measure()).find(s => s.id === "review-checkbox-off").display, "block");
  await key("Tab", "Tab", 9);
  assert.equal(await evaluate("document.activeElement.id"), "review-switch-off");
  await key(" ", "Space", 32);
  assert.equal((await measure()).find(s => s.id === "review-switch-off").marker[0], 24);
  assert.equal((await values()).length, 4);
  await until("document.querySelector('#choice-review-changes').textContent==='2'", "Keyboard change events missing");
  await click("#choice-review-reset");
  assert.deepEqual(await values(), initial);
  validate(await measure());
  await click("label[for=review-checkbox-off]");
  await click("label[for=review-switch-off]");
  assert.equal((await values()).length, 4);
  // Compare post-reset React event tracking with undecorated native inputs.
  // Native reset updates checked without dispatching change; do not add custom
  // state, synthetic change events or private React tracker manipulation.
  await focus("#reference-checkbox"); await key(" ", "Space", 32);
  await focus("#reference-switch"); await key(" ", "Space", 32);
  await until("document.querySelector('#reference-changes').textContent==='2'", "Native React reference events missing");
  await click("#reference-reset");
  await click("label[for=reference-checkbox]"); await click("label[for=reference-switch]");
  const eventComparison = await evaluate("({decoratedReact:Number(document.querySelector('#choice-review-changes').textContent),referenceReact:Number(document.querySelector('#reference-changes').textContent),decoratedNative:window.__choiceNativeChanges,referenceNative:window.__referenceNativeChanges})");
  assert.equal(eventComparison.decoratedNative, 4);
  assert.equal(eventComparison.referenceNative, 4);
  assert.equal(eventComparison.decoratedReact, eventComparison.referenceReact, "Decoration changed React's native reset/event contract");
  results.nativeResetEventComparison = eventComparison;
  // Fresh pointer interactions must independently fire the two React changes.
  await navigate(route);
  await click("label[for=review-checkbox-off]"); await click("label[for=review-switch-off]");
  await until("document.querySelector('#choice-review-changes').textContent==='2'", "Fresh pointer React change events missing");
  await click("#choice-review-reset");
  await focus("#review-checkbox-on"); await key("Tab", "Tab", 9, 8);
  assert.equal(await evaluate("document.activeElement.id"), "review-switch-off");
  const disabledBefore = (await measure()).filter(s => s.disabled).map(s => [s.id, s.checked]);
  await click("label[for=choice-background-checkbox-disabled-on]");
  await click("label[for=choice-background-switch-disabled-on]");
  assert.deepEqual((await measure()).filter(s => s.disabled).map(s => [s.id, s.checked]), disabledBefore);
  const ax = await cmd("Accessibility.getFullAXTree");
  assert.ok(ax.nodes.some(n => n.role?.value === "checkbox" && n.name?.value === "Checkbox de muestra"));
  assert.ok(ax.nodes.some(n => n.role?.value === "switch" && n.name?.value === "Switch de muestra"));
  results.interactions = { keyboardSpace: true, forwardAndReverseTab: true, pointerLabel: true, nativeReset: true, formData: true, changeEvents: true, fieldsetDisabled: true, stableAccessibleNames: true };
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  validate(await measure()); results.reducedMotion = true;
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
  const forced = await evaluate("[...document.querySelectorAll('#boolean-review input,#choice-state-review input')].map(e=>({appearance:getComputedStyle(e).appearance,background:getComputedStyle(e).backgroundImage,decoration:getComputedStyle(e.nextElementSibling).display,checked:e.checked}))");
  assert.ok(forced.every(s => s.appearance === "auto" && s.background === "none" && s.decoration === "none"), JSON.stringify(forced));
  await focus("#review-checkbox-off"); await key(" ", "Space", 32);
  assert.equal(await evaluate("document.activeElement.checked"), true);
  await shotElement("#boolean-review", "choice-forced-colors");
  results.forcedColors = { nativeFallback: true, decorationsHidden: true, keyboard: true };
  await cmd("Emulation.setEmulatedMedia", { features: [] });
  await navigate(route);
  report.choiceAccessibility = results;
}
