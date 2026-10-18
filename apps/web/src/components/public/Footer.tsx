import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { footerRoutes } from "@/lib/navigation/public-routes";
import { PublicNavLink } from "./PublicNavLink";
import styles from "./public-layout.module.css";

export function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.footerInner}>
      <div className={styles.footerBrand}>
        <Link href="/" aria-label="KevoLint · Inicio" className={styles.home}><BrandLogo decorative /></Link>
        <p>by KevoSilva · Auditoría estática de workflows para n8n</p>
        <p>Herramienta independiente, no afiliada a n8n.</p>
        <p>Prototipo · todos los datos son ficticios</p>
      </div>
      <nav aria-label="Ayuda y documentos legales" className={styles.footerLinks}>
        {footerRoutes.map((route) => <PublicNavLink key={route.href} href={route.href}>{route.label}</PublicNavLink>)}
      </nav>
    </div>
  </footer>;
}
