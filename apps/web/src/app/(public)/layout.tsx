import type { ReactNode } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>
    <a href="#main-content" className="skip-navigation">Saltar al contenido</a>
    <PublicHeader />
    {children}
    <Footer />
  </>;
}
