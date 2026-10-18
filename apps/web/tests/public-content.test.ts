import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { motors, plans, helpEntries, landingFaq, commercialNotice, filterHelp, readHelpQuery } from "../src/lib/content/public/content";
import { termsDraft, privacyDraft, cookiesDraft } from "../src/lib/content/public/legal-drafts";
import { PublicFaq } from "../src/components/public/content/PublicFaq";
import { PublicPlanCards } from "../src/components/public/content/PublicPlanCard";
import { DemoReportPreview } from "../src/components/public/content/DemoReportPreview";
import { LegalPage } from "../src/components/public/content/LegalPage";
import LandingPage from "../src/app/(public)/page";
import HowPage from "../src/app/(public)/como-funciona/page";
import PricingPage from "../src/app/(public)/precios/page";
import SecurityPage from "../src/app/(public)/seguridad/page";
import HelpPage from "../src/app/(public)/ayuda/page";
import TermsPage from "../src/app/(public)/legal/terminos/page";
import PrivacyPage from "../src/app/(public)/legal/privacidad/page";
import CookiesPage from "../src/app/(public)/legal/cookies/page";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
const html = (element: ReactElement) => renderToStaticMarkup(element);

describe("PR04 truthful public content", () => {
  it("uses exactly the four real static engine categories and original icons", () => {
    expect(motors.map((m) => m.title)).toEqual(["Ciberseguridad e Integraciones", "Arquitectura y Escalabilidad", "Lógica y Flujo de Datos", "Prompt Engineering y Agentes IA"]);
    expect(motors.map((m) => m.icon)).toEqual(["shield", "workflow", "data-flow", "agent"]);
  });
  it("keeps provisional values explicitly unapproved and purchasing inactive", () => {
    expect(plans.map((p) => [p.name,p.quota,p.days])).toEqual([["Starter",10,7],["Pro",100,90],["Power",500,180]]);
    const result = html(createElement(PublicPlanCards));
    expect((result.match(/disabled=""/g) || []).length).toBe(3);
    expect((result.match(/Precio por definir/g) || []).length).toBe(3);
    expect((result.match(/auditorías \/ mes propuestas/g) || []).length).toBe(3);
    expect(result).toContain("días de historial propuestos");
    expect(result).toContain("solo tras pruebas de carga y aprobación");
    expect(commercialNotice).toContain("D05 pendiente");
    expect(result).not.toMatch(/checkout|\$0|S\/\s*0|€0|href="/);
  });
  it("labels report numbers and redacted evidence as fictitious DEMO", () => {
    const result = html(createElement(DemoReportPreview));
    expect(result).toContain("Informe de ejemplo · DEMO");
    expect(result).toContain("No es el resultado de una auditoría real");
    expect(result).toContain("[REDACTADO]");
    expect(result).not.toContain("href=");
    expect(result).not.toContain("/app/");
  });
  it("renders a usable native FAQ in SSR with no JavaScript dependency", () => {
    const result = html(createElement(PublicFaq,{entries:landingFaq}));
    expect((result.match(/<details open/g)||[]).length).toBe(3);
    expect((result.match(/<summary/g)||[]).length).toBe(3);
    for(const entry of landingFaq) expect(result).toContain(entry.answer);
    expect(result).not.toMatch(/role="button"|tabindex=/i);
  });
  it.each([termsDraft,privacyDraft,cookiesDraft])("keeps $title visibly subject to D08", (document) => {
    const result = html(createElement(LegalPage,{document}));
    expect(result).toContain("Pendiente de revisión legal");
    expect(result).toContain("exclusivamente para revisión de desarrollo");
    expect(result).toContain("D08 pendiente");
    expect(result).toContain("No autoriza un despliegue comercial");
    expect(result).not.toMatch(/jurisdicción peruana|ISO 27001 certificado|SOC 2 certificado|@kevolint/);
  });
  it.each([LandingPage,HowPage,PricingPage,SecurityPage,TermsPage,PrivacyPage,CookiesPage])("renders %s with one main and one H1 on the server", (Page) => {
    const result=html(createElement(Page));
    expect((result.match(/<main\b/g)||[]).length).toBe(1);
    expect((result.match(/<h1\b/g)||[]).length).toBe(1);
    expect(result).toContain('id="main-content"');
    expect(result).toContain('tabindex="-1"');
    expect(result).not.toMatch(/<form[^>]*(?:sign|checkout)|figma\.com\/api\/mcp\/asset/);
  });
  it("server-renders real help search without client JavaScript", async () => {
    const result=html(await HelpPage({searchParams:Promise.resolve({q:"límite archivo"})}));
    expect(result).toContain("¿Qué límites tiene el archivo?");
    expect(result).not.toContain("¿Cómo recupero mi cuenta?");
    expect(result).toContain('method="get"');
    expect(result).toContain('role="status"');
    expect(result).toContain("1 guía encontrada");
  });
  it("escapes query content and produces an honest empty result", async () => {
    const result=html(await HelpPage({searchParams:Promise.resolve({q:'<script>alert(1)</script>'})}));
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
    expect(result).toContain("No encontramos guías");
  });
});

describe("local help search", () => {
  it("matches case, accents and all query words", () => {
    expect(filterHelp(helpEntries,"  LÍMITE archivo  ").map(x=>x.id)).toEqual(["limits"]);
    expect(filterHelp(helpEntries,"AUTENTICACION").map(x=>x.id)).toContain("account");
  });
  it("returns all entries for empty or whitespace search", () => {
    expect(filterHelp(helpEntries,"  ")).toEqual(helpEntries);
  });
  it.each(["no-existe-esta-guia", ".*[", "<script>"])("treats %s as literal search data", (q) => {
    expect(filterHelp(helpEntries,q)).toEqual([]);
  });
  it("limits GET input and rejects ambiguous arrays", () => {
    expect(readHelpQuery(["x","y"])).toBe("");
    expect(readHelpQuery(undefined)).toBe("");
    expect(readHelpQuery("x".repeat(200))).toHaveLength(120);
  });
});

describe("Figma provenance and resource integrity", () => {
  it("records all 32 frames and only approved motion", async () => {
    const m=JSON.parse(await readFile("design-system/public-pages.json","utf8"));
    expect(m.routes).toHaveLength(8);
    expect(m.routes.flatMap((r: {variants:Record<string,{id:string}>})=>Object.values(r.variants))).toHaveLength(32);
    expect(m.motion.included).toEqual(["M01","M02","M03","M09","M17"]);
    expect(m.motion.excluded).toEqual(["M04"]);
    expect(m.motion.staticOriginalBrand).toBe("M14");
    expect(m.handoff.sha256).toBe("6b5270ed7db44693650f79b64ed2f26d7cad31f0cfc62192974cc904378716aa");
  });
  it("preserves original functional icon bytes, geometry and non-executable SVG", async () => {
    const m=JSON.parse(await readFile("design-system/public-pages.json","utf8"));
    expect(m.assets).toHaveLength(12);
    for(const asset of m.assets) {
      const bytes=await readFile(asset.path);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(bytes.toString()).toContain('width="24" height="24" viewBox="0 0 24 24"');
      expect(bytes.toString()).not.toMatch(/<(script|foreignObject|text)\b|\bon\w+=|(?:href|xlink:href)=/i);
    }
  });
  it("keeps temporary URLs out of runtime code and no new provider integrations", async () => {
    for(const name of await readdir("src/components/public/content")) {
      const source=await readFile("src/components/public/content/"+name,"utf8");
      expect(source).not.toMatch(/figma\.com\/api\/mcp\/asset|dangerouslySetInnerHTML|localStorage|sessionStorage|fetch\(|@clerk|supabase|paddle|sentry|gsap|react-bits/i);
    }
  });
});
