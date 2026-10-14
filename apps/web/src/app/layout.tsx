import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "n8n QA | Auditoría de workflows",
  description: "Analiza workflows exportados de n8n para detectar riesgos técnicos y mejorar su arquitectura.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
