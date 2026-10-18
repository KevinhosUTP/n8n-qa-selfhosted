import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Input } from "../src/components/ui/Input";
import { SelectField } from "../src/components/ui/SelectField";
import { Checkbox } from "../src/components/ui/Checkbox";
import { Radio } from "../src/components/ui/Radio";
import { Switch } from "../src/components/ui/Switch";
import { TextLink } from "../src/components/ui/TextLink";
import { Badge, type BadgeTone } from "../src/components/ui/Badge";
import { Alert } from "../src/components/ui/Alert";
import { Card } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";
import { Skeleton } from "../src/components/ui/Skeleton";
import { HistoryFilterField } from "../src/components/ui/filters/HistoryFilterField";
import { ReportSelect } from "../src/components/ui/filters/ReportSelect";
import { descriptionIds } from "../src/components/ui/Field";
import manifest from "../design-system/shared-ui.json";

const options = [{ value: "", label: "Elige una opción", disabled: true }, { value: "one", label: "Primera" }];
const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);

describe("PR05a native fields", () => {
  it("associates a persistent label, external description, hint and error", () => {
    const s = html(createElement(Input, { id: "name", label: "Nombre", hint: "Ayuda", error: "Revisa el valor", "aria-describedby": "scope", required: true }));
    for (const value of ['for="name"', 'id="name"', 'id="name-hint"', 'id="name-error"', 'aria-describedby="scope name-hint name-error"', 'aria-invalid="true"', 'required=""']) expect(s).toContain(value);
    expect(s).not.toContain('role="alert"');
  });
  it("preserves native form/value/readonly/disabled contracts", () => {
    const s = html(createElement(Input, { label: "Nombre", defaultValue: "Inicial", name: "name", form: "example", readOnly: true, disabled: true, autoComplete: "off", maxLength: 120 }));
    for (const value of ['value="Inicial"', 'name="name"', 'form="example"', 'readOnly=""', 'disabled=""', 'maxLength="120"']) expect(s).toContain(value);
    expect(s).not.toContain('aria-invalid=');
  });
  it("merges and deduplicates describedby without dropping caller IDs", () => {
    expect(descriptionIds("a", "Hint", "Error", "scope a-hint scope")).toBe("scope a-hint a-error");
    expect(descriptionIds("a")).toBeUndefined();
  });
  it("generates unique IDs and escapes untrusted strings", () => {
    const s = html(createElement("div", null, createElement(Input, { label: "<script>" }), createElement(Input, { label: "Second" })));
    const ids = [...s.matchAll(/<input[^>]+id="([^"]+)"/g)].map((v) => v[1]);
    expect(new Set(ids).size).toBe(2); expect(s).toContain("&lt;script&gt;"); expect(s).not.toContain("<script>");
  });
  it.each([SelectField, ReportSelect])("renders one named native select with real options", (Component) => {
    const s = html(createElement(Component, { id: "select", label: "Selector", options, defaultValue: "one", required: true, error: "Revisa", name: "choice" }));
    expect(s.match(/<select\b/g)).toHaveLength(1);
    for (const value of ['for="select"', 'name="choice"', 'required=""', 'aria-invalid="true"', 'value="" disabled=""', 'value="one" selected=""']) expect(s).toContain(value);
    expect(s).not.toContain('role="listbox"');
  });
  it.each([Checkbox, Radio, Switch])("preserves native checked, required, disabled and form attributes", (Component) => {
    const s = html(createElement(Component, { id: "choice", name: "group", label: "Opción", defaultChecked: true, required: true, disabled: true, value: "one", hint: "Ayuda", error: "Revisa" }));
    for (const value of ['for="choice"', 'name="group"', 'checked=""', 'required=""', 'disabled=""', 'value="one"', 'aria-describedby="choice-hint choice-error"', 'aria-invalid="true"']) expect(s).toContain(value);
    expect(s).not.toContain('readonly=');
  });
  it("uses native radio and checkbox semantics, with switch role only for Switch", () => {
    expect(html(createElement(Radio, { label: "Radio" }))).toContain('type="radio"');
    expect(html(createElement(Checkbox, { label: "Checkbox" }))).not.toContain('role="switch"');
    expect(html(createElement(Switch, { label: "Switch" }))).toContain('role="switch"');
  });
  it("shares real Input/Select primitives across history/report presentations", () => {
    const a = html(createElement(HistoryFilterField, { kind: "search", label: "Buscar", applied: true, defaultValue: "texto" }));
    const b = html(createElement(HistoryFilterField, { kind: "select", label: "Severidad", options, applied: true }));
    expect(a).toContain('type="search"'); expect(a).toContain('data-applied="true"');
    expect(b.match(/<select\b/g)).toHaveLength(1); expect(b).not.toContain('kind="select"');
  });
  it("does not invent unsupported HTML states (compile-time contracts)", () => {
    // @ts-expect-error Native select has no readonly contract.
    createElement(SelectField, { label: "Select", options, readOnly: true });
    // @ts-expect-error Checkbox has no native readonly contract.
    createElement(Checkbox, { label: "Checkbox", readOnly: true });
    // @ts-expect-error PR05a only supports single select.
    createElement(SelectField, { label: "Select", options, multiple: true });
    // @ts-expect-error No visual variant absent from Figma.
    createElement(Input, { label: "Input", variant: "compact" });
  });
});

describe("PR05a feedback and navigation", () => {
  it("keeps navigation as an anchor; disabled is non-navigable", () => {
    expect(html(createElement(TextLink, { href: "/ayuda" }, "Ayuda"))).toContain('href="/ayuda"');
    const s = html(createElement(TextLink, { disabled: true, id: "pending", "aria-label": "Destino pendiente", onClick: () => { throw Error("must not be retained"); } }, "Pendiente"));
    expect(s).toContain('aria-disabled="true"'); expect(s).not.toMatch(/href=|tabindex=|<button/);
    expect(s).toContain('id="pending"'); expect(s).toContain('aria-label="Destino pendiente"');
    // @ts-expect-error A disabled TextLink cannot retain a live destination.
    createElement(TextLink, { disabled: true, href: "/ayuda" }, "Disabled");
  });
  it.each(["critical", "warning", "success", "accent", "muted"] as BadgeTone[])("renders %s badge with text and decorative original icon", (tone) => {
    const s = html(createElement(Badge, { tone, children: "Estado" }));
    expect(s).toContain("Estado"); expect(s).toContain('width="16"'); expect(s).toContain('alt=""'); expect(s).not.toContain('tabindex=');
  });
  it.each(["off", "polite", "assertive"] as const)("announces only as explicitly requested: %s", (announce) => {
    const s = html(createElement(Alert, { tone: "critical", title: "Atención", announce, children: "Detalle" }));
    if (announce === "off") expect(s).not.toContain('role=');
    else expect(s).toContain(`role="${announce === "polite" ? "status" : "alert"}"`);
  });
  it("keeps Card structural and EmptyState actions caller-owned", () => {
    const s = html(createElement(Card, null, "Contenido")); expect(s).not.toMatch(/role=|tabindex=|<button/);
    const empty = html(createElement(EmptyState, { title: "Sin elementos", children: "Descripción", action: createElement(TextLink, { href: "/ayuda" }, "Ayuda") }));
    expect(empty).toContain('<h2'); expect(empty).toContain('href="/ayuda"'); expect(empty).not.toContain("/app");
  });
  it("keeps skeleton decorative without fake loading values or announcements", () => {
    const s = html(createElement(Skeleton)); expect(s).toContain('aria-hidden="true"'); expect(s.match(/<span/g)).toHaveLength(3); expect(s).not.toMatch(/role=|aria-valuenow|0%/);
  });
});

describe("original PR05a exports", () => {
  it.each(manifest.assets)("preserves original SVG bytes and geometry: $name", async (asset) => {
    const bytes = await readFile(asset.path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
    const svg = bytes.toString("utf8");
    expect(svg).toContain(`width="${asset.width}"`); expect(svg).toContain(`height="${asset.height}"`);
    expect(svg).not.toMatch(/<script|<foreignObject|https?:\/\/(?!www.w3.org)/);
  });
});
