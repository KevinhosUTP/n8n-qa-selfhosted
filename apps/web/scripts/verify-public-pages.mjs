import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { readFile, appendFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { prepareStandalone } from "./standalone-entry.mjs";
import { testEnvironment } from "./test-environment.mjs";
const entry=await prepareStandalone();
const socket=createServer();socket.listen(0,"127.0.0.1");await once(socket,"listening");
const {port}=socket.address();await new Promise(r=>socket.close(r));
const origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,[entry],{cwd:dirname(entry),env:testEnvironment({PORT:String(port),HOSTNAME:"127.0.0.1"}),stdio:"inherit",windowsHide:true});
let startupError;server.once("error",error=>{startupError=error});
try{
  let ready=false;
  for(let i=0;i<100;i++){
    assert.ok(!startupError&&server.exitCode===null,"Standalone did not start");
    try{if((await fetch(origin,{signal:AbortSignal.timeout(1000)})).status===200){ready=true;break;}}catch{/* startup */}
    await delay(200);
  }
  assert.ok(ready,"Standalone readiness timed out");
  const browser=spawn(process.execPath,["scripts/check-public-pages-browser.mjs",origin],{env:testEnvironment(),stdio:"inherit",windowsHide:true});
  const timeout=setTimeout(()=>browser.kill(),300_000);
  try{const [code]=await once(browser,"exit");assert.equal(code,0,"PR04 standalone browser verification failed");}finally{clearTimeout(timeout);}
  const report=JSON.parse(await readFile(resolve("../../.tools/pr04/browser/report.json"),"utf8"));
  assert.equal(report.passed,true);
  const summary=`## PR04 · Public pages in real standalone browser\n\nRevision: ${report.sourceRevision}; ${process.platform}; ${report.browser.product}.\n\nPASS: ${report.responsive.length} samples / 32 Figma frames; 8 pages without JavaScript; native FAQ keyboard/AX; local search and GET fallback; CTA boundaries, reduced motion, original icons, console and layout stability.\n\nD05 commercial values remain proposals. D08 legal pages remain development drafts. No commercial deployment or integral WCAG conformance claimed.\n`;
  console.log(summary);
  if(process.env.GITHUB_ACTIONS==="true"&&process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
}finally{
  if(server.exitCode===null&&!startupError){const done=once(server,"exit");server.kill();await Promise.race([done,delay(5000)]);if(server.exitCode===null){server.kill("SIGKILL");await done;}}
}
