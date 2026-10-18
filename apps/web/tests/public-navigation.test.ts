import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { publicRoutes, headerRoutes, drawerRoutes, footerRoutes, isCurrentPublicRoute } from "../src/lib/navigation/public-routes";
import { PublicNavLink } from "../src/components/public/PublicNavLink";
import { PublicHeader } from "../src/components/public/PublicHeader";
import { Footer } from "../src/components/public/Footer";
import { PublicContainer } from "../src/components/public/PublicContainer";

vi.mock("next/navigation", () => ({ usePathname: () => "/precios" }));
const html = (element: ReactElement) => renderToStaticMarkup(element);

describe("approved public navigation", () => {
  it("preserves canonical destinations and implementation boundaries", () => {
    expect(publicRoutes.map((route) => route.href)).toEqual(["/", "/como-funciona", "/seguridad", "/precios", "/sign-in", "/sign-up", "/ayuda", "/legal/terminos", "/legal/privacidad", "/legal/cookies"]);
    expect(publicRoutes.filter((route) => route.implemented).map((route) => route.href)).toEqual(["/"]);
    expect(publicRoutes.filter((route) => route.stage === "PR06").map((route) => route.href)).toEqual(["/sign-in", "/sign-up"]);
    expect(new Set(publicRoutes.map((route) => route.href)).size).toBe(publicRoutes.length);
  });
  it("keeps header/footer placement and excludes private drawer links", () => {
    expect(headerRoutes.map((route) => route.href)).toEqual(publicRoutes.slice(1, 6).map((route) => route.href));
    expect(footerRoutes.map((route) => route.href)).toEqual(publicRoutes.slice(6).map((route) => route.href));
    expect(drawerRoutes.some((route) => route.label === "Ayuda")).toBe(true);
    expect(drawerRoutes.every((route) => !route.href.startsWith("/app"))).toBe(true);
    expect(drawerRoutes.filter((route) => route.href === "/sign-up")).toHaveLength(1);
  });
  it.each(publicRoutes)("matches $href exactly without prefix collisions", (route) => {
    expect(isCurrentPublicRoute(route.href, route.href)).toBe(true);
    expect(isCurrentPublicRoute(`${route.href}/child`, route.href)).toBe(false);
  });
  it.each(["primary", "secondary", "tertiary"] as const)("uses a real anchor for %s navigation", (variant) => {
    const result = html(createElement(PublicNavLink, { href: "/precios", variant, children: "Precios" }));
    expect(result).toMatch(/<a\b[^>]*href="\/precios"/);
    expect(result).toContain('aria-current="page"');
    expect(result).toContain(`data-variant="${variant}"`);
    expect(result).not.toContain("<button");
    expect(result).not.toContain('role="button"');
  });
  it("does not mark another URL as current", () => {
    expect(html(createElement(PublicNavLink, { href: "/seguridad", children: "Seguridad" }))).not.toContain("aria-current");
  });
  it("provides named header/navigation and a correctly named modal trigger", () => {
    const result = html(createElement(PublicHeader));
    expect(result).toContain("<header");
    expect(result).toContain('aria-label="Principal"');
    expect(result).toContain('aria-label="Abrir menú"');
    expect(result).toContain('aria-expanded="false"');
    expect(result).toContain('aria-controls="public-navigation-drawer"');
    expect(result).toContain('aria-label="Navegación pública"');
    expect(result).toContain('aria-modal="true"');
    expect(result).not.toContain('role="menu"');
    expect(result).toContain('alt=""');
  });
  it("keeps approved footer copy, legal URLs and original brand composition", () => {
    const result = html(createElement(Footer));
    expect(result).toContain("<footer");
    expect(result).toContain("by KevoSilva");
    expect(result).toContain("Herramienta independiente, no afiliada a n8n.");
    expect(result).toContain("Prototipo · todos los datos son ficticios");
    for (const route of footerRoutes) expect(result).toContain(`href="${route.href}"`);
    expect(result).toContain("/brand/kevolint-horizontal-dark.svg");
  });
  it("lets a reusable container accept caller content/classes", () => {
    expect(html(createElement(PublicContainer, { children: "Contenido", className: "caller" }))).toMatch(/class="[^"]*caller"[^>]*>Contenido/);
  });
  it("retains the exact functional Figma icon, separately from 24 brand originals", async () => {
    const manifest = JSON.parse(await readFile("design-system/public-layout.json", "utf8"));
    for (const asset of manifest.assets) {
      const bytes = await readFile(asset.path);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(bytes.toString()).toContain('viewBox="0 0 24 24"');
      expect(bytes.toString()).not.toMatch(/<(script|foreignObject|text)\b|\bon\w+=|href=/i);
    }
  });
});
