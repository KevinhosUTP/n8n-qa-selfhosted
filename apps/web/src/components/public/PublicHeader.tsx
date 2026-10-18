import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PublicNavigation } from "./PublicNavigation";
import styles from "./public-layout.module.css";

export function PublicHeader() {
  return <header className={styles.header}>
    <div className={styles.headerInner}>
      <Link href="/" aria-label="KevoLint · Inicio" className={styles.home} data-public-home><BrandLogo decorative /></Link>
      <PublicNavigation />
    </div>
  </header>;
}
