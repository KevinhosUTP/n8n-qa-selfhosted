import type { ReactNode } from "react";
import { PublicContainer } from "@/components/public/PublicContainer";
import styles from "./public-content.module.css";

export function PublicPage({ children, landing = false }: { children: ReactNode; landing?: boolean }) {
  return <main id="main-content" tabIndex={-1}><PublicContainer className={landing ? styles.landing : styles.page}>{children}</PublicContainer></main>;
}
export function PublicPageIntro({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return <><p className={styles.eyebrow}>{eyebrow}</p><h1 className={styles.pageTitle}>{title}</h1><p className={styles.muted}>{description}</p></>;
}
