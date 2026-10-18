import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { Dialog } from "../src/components/ui/Dialog";
import { Drawer } from "../src/components/ui/Drawer";
import { Toast, type ToastTone } from "../src/components/ui/Toast";
import { ToastRegion } from "../src/components/ui/ToastRegion";
import { ModalCloseButton } from "../src/components/ui/ModalCloseButton";
import { ModalSurface, ModalCloseButton as PublicClose } from "../src/components/public/internal/ModalSurface";
import { assertNoDesignPreview } from "../scripts/check-design-build.mjs";
import manifest from "../design-system/modal-feedback.json";

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
describe("shared modal contracts", () => {
  it.each([Dialog, Drawer])("labels the native closed dialog and associates its optional description", (Component) => {
    const output = html(createElement(Component, { id: "sample", open: false, title: "Título", description: "Descripción", onCloseRequest() {}, children: "Contenido" }));
    for (const value of ['<dialog', 'aria-labelledby="sample-title"', 'aria-describedby="sample-description"', 'id="sample-title"', 'id="sample-description"', 'aria-modal="true"', 'Contenido']) expect(output).toContain(value);
    expect(output).not.toMatch(/<dialog[^>]*\bopen=/);
    expect(output).not.toMatch(/<dialog[^>]*tabindex=/);
  });
  it.each([Dialog, Drawer])("does not flatten structured children into aria-describedby", (Component) => {
    const output = html(createElement(Component, { open: false, title: "Contenido", onCloseRequest() {}, children: createElement("ul", null, createElement("li", null, "Detalle")) }));
    expect(output).not.toContain('aria-describedby='); expect(output).toContain('<ul>');
  });
  it("uses unique generated label IDs for multiple closed instances", () => {
    const output = html(createElement("div", null, createElement(Dialog, { open: false, title: "Uno", onCloseRequest() {} }), createElement(Dialog, { open: false, title: "Dos", onCloseRequest() {} })));
    const labels = [...output.matchAll(/aria-labelledby="([^"]+)"/g)].map((value) => value[1]);
    expect(labels).toHaveLength(2); expect(new Set(labels).size).toBe(2);
  });
  it("keeps the public adapter name and native secondary close button", () => {
    const output = html(createElement(ModalSurface, { id: "public", open: false, onDismiss() {}, returnFocus: () => null, children: createElement(PublicClose) }));
    for (const value of ['aria-label="Navegación pública"', 'Cerrar menú', 'data-modal-initial-focus', 'type="button"', 'data-variant="secondary"']) expect(output).toContain(value);
  });
  it("requires a modal context for shared close controls", () => {
    expect(() => html(createElement(ModalCloseButton, null, "Cerrar"))).toThrow(/requires Dialog/);
  });
  it("does not give modal dismiss controls form-submit semantics", () => {
    // @ts-expect-error Dismiss is separate from native form submission and validation.
    createElement(ModalCloseButton, { type: "submit" });
  });
});
describe("one Toast and one announcement region", () => {
  it.each(["neutral", "success", "warning", "error"] as ToastTone[])("renders %s without its own live role or action", (tone) => {
    const output = html(createElement(Toast, { tone, label: "<script>Texto largo</script>" }));
    expect(output).toContain(`data-tone="${tone}"`);
    expect(output).toContain('width="24"'); expect(output).toContain('height="24"'); expect(output).toContain('alt=""');
    expect(output).toContain('&lt;script&gt;'); expect(output).not.toMatch(/role=|aria-live=|<button|<script>/);
  });
  it("renders an empty stable region before the first message", () => {
    const output = html(createElement(ToastRegion, { message: null }));
    expect(output).toContain('role="status"'); expect(output).toContain('aria-live="polite"'); expect(output).toContain('aria-atomic="true"');
    expect(output).not.toContain('<img');
  });
  it("uses one live surface for the composed message", () => {
    const output = html(createElement(ToastRegion, { message: { id: "event-1", tone: "error", label: "Muestra" } }));
    expect(output.match(/role="status"/g)).toHaveLength(1); expect(output.match(/aria-live=/g)).toHaveLength(1);
    expect(output).not.toContain('role="alert"'); expect(output).toContain('Muestra');
  });
});
describe("provenance and fixture isolation", () => {
  it.each(manifest.reusedAssets)("preserves reused original bytes and dimensions: $path", async (asset) => {
    const bytes = await readFile(asset.path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
    expect(bytes.toString("utf8")).toMatch(/width="24" height="24"/);
  });
  it("rejects the PR05b temporary route at production prebuild", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "kevolint-pr05b-guard-"));
    try {
      await assertNoDesignPreview(temporary);
      await mkdir(resolve(temporary, "src/app/pr05b-modal-feedback-preview"), { recursive: true });
      await expect(assertNoDesignPreview(temporary)).rejects.toThrow(/PR05b/);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  });
});
