import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, type ButtonVariant } from "../src/components/ui/Button";

describe("Button native semantics (browser interaction is verified separately)", () => {
  it.each(["primary", "secondary", "tertiary", "destructive"] as ButtonVariant[])("renders %s as a named native button", (variant) => {
    const html = renderToStaticMarkup(createElement(Button, { variant }, "Continuar"));
    expect(html).toMatch(/^<button /);
    expect(html).toContain('type="button"');
    expect(html).toContain(`data-variant="${variant}"`);
    expect(html).toContain(">Continuar</button>");
    expect(html).not.toContain("disabled=");
    expect(html).not.toContain("aria-busy=");
  });
  it("preserves native form attributes and an explicit accessible name", () => {
    const html = renderToStaticMarkup(createElement(Button, { type: "submit", name: "intent", value: "save", "aria-label": "Guardar cambios" }, "Guardar"));
    for (const attribute of ['type="submit"', 'name="intent"', 'value="save"', 'aria-label="Guardar cambios"']) expect(html).toContain(attribute);
  });
  it.each([false, true])("loading blocks duplicate activation even when disabled=%s", (disabled) => {
    const html = renderToStaticMarkup(createElement(Button, { loading: true, disabled }, "Analizando…"));
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-loading="true"');
    expect(html).toContain("Analizando…");
  });
  it("disabled stays native without falsely announcing loading", () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, "Continuar"));
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("aria-busy=");
  });
  it("rejects an unsupported variant", () => {
    // @ts-expect-error Negative runtime contract.
    expect(() => renderToStaticMarkup(createElement(Button, { variant: "danger" }, "Eliminar"))).toThrow();
  });
});
