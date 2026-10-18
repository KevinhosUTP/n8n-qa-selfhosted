"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { PublicContainer } from "@/components/public/PublicContainer";

/** Temporary lifecycle fixture only; never a product route or a fake pending page. */
export default function PublicLayoutPreview() {
  const [mounted, setMounted] = useState(true);
  return <>
    {mounted && <PublicHeader />}
    <main id="main-content" tabIndex={-1} style={{ minHeight: 1500, paddingBlock: 64 }}>
      <PublicContainer>
        <h1>PR03 · Fixture local de ciclo de vida</h1>
        <p>Controles de prueba. No es una página de producto.</p>
        <button id="toggle-public-header" onClick={() => setMounted((value) => !value)}>Montar o desmontar header</button>
      </PublicContainer>
    </main>
    <Footer />
  </>;
}
