import type { Metadata } from "next";
import { getServerConfig } from "@/lib/config/server";
import { inter } from "@/lib/design-system/fonts";
import { RouteFocus } from "@/components/public/RouteFocus";
import "@/styles/tokens.generated.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "KevoLint · Desarrollo",
  description: "Base técnica de desarrollo de KevoLint.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  getServerConfig();
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}<RouteFocus /></body>
    </html>
  );
}
