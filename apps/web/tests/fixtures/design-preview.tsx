"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import type { BrandComposition } from "@/lib/design-system/brand-assets";

const variants: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];
const compositions: BrandComposition[] = ["Horizontal", "Compact", "Wordmark", "Symbol", "WithSignature", "WithDescriptor"];

/** Temporary browser fixture, created only by design:preview and removed on exit. */
export default function DesignPreview() {
  const [count, setCount] = useState(0);
  return (
    <main className="technical">
      <h1 className="kl-type-h2">PR02 · Validación local</h1>
      <p>Fixture temporal. No forma parte del artefacto de producción.</p>
      <output id="activation-count" aria-live="polite">Activaciones: {count}</output>
      <section aria-label="Estados de Button" className="technical-copy">
        <h2 className="kl-type-title">Dark · Button</h2>
        {variants.map((variant) => (
          <div key={variant} className="technical-actions">
            <Button id={`dark-${variant}`} variant={variant} onClick={() => setCount((n) => n + 1)}>Continuar</Button>
            <Button id={`dark-${variant}-disabled`} variant={variant} disabled onClick={() => setCount((n) => n + 1)}>Continuar</Button>
            <Button id={`dark-${variant}-loading`} variant={variant} loading onClick={() => setCount((n) => n + 1)}>Analizando…</Button>
          </div>
        ))}
      </section>
      <section aria-label="ISSUE-HC-01 aislado" data-kl-qa-theme="high-contrast" className="technical-copy">
        <h2 className="kl-type-title">HC · Destructivo aislado, tema no habilitado</h2>
        <div className="technical-actions">
          <Button id="hc-destructive" variant="destructive" onClick={() => setCount((n) => n + 1)}>Continuar</Button>
          <Button id="hc-destructive-disabled" variant="destructive" disabled onClick={() => setCount((n) => n + 1)}>Continuar</Button>
          <Button id="hc-destructive-loading" variant="destructive" loading onClick={() => setCount((n) => n + 1)}>Analizando…</Button>
        </div>
      </section>
      <section className="technical-copy" aria-label="Reflow de contenido">
        <h2 className="kl-type-title">Texto largo</h2>
        <Button id="long-button">Continuar con la comprobación de accesibilidad del sistema visual inicial de KevoLint</Button>
      </section>
      <section className="technical-copy" aria-label="Tipografía Inter">
        <h2 className="kl-type-title">Inter local · 400 / 500 / 600</h2>
        {Object.entries({ display: "KevoLint", h1: "Auditoría estática", h2: "Workflows para n8n", h3: "Resultados de calidad", title: "Revisión del workflow", body: "Auditoría, revisión y calidad: áéíóú ñ ¿¡ 0123456789 € %", "body-strong": "Cuerpo destacado", label: "Continuar", small: "Información secundaria", "small-strong": "Información destacada" }).map(([role, text]) => (
          <p id={`type-${role}`} className={`kl-type-${role}`} key={role}>{text}</p>
        ))}
      </section>
      <section className="technical-copy" aria-label="Marca Dark mínima">
        <h2 className="kl-type-title">Marca Dark · tamaño mínimo</h2>
        {compositions.filter((c) => !["WithSignature", "WithDescriptor"].includes(c)).map((composition) => <BrandLogo key={composition} composition={composition} />)}
      </section>
      <section className="technical-copy" aria-label="Originales de marca" style={{ overflowX: "auto" }}>
        <h2 className="kl-type-title">Originales completos · comparación local</h2>
        <p>Este panel permite desplazar los originales de 380 px sin reducir firmas por debajo del mínimo.</p>
        {compositions.map((composition) => (
          <div key={composition} style={{ display: "grid", gap: "var(--kl-spacing-16)", width: "max-content" }}>
            <BrandLogo composition={composition} size="original" />
            <div data-kl-brand-reference="light" style={{ background: "var(--kl-reference-3a-color-background)", padding: "var(--kl-spacing-16)", width: "max-content" }}>
              <BrandLogo composition={composition} surface="Light" size="original" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
