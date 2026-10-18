import { PublicPage, PublicPageIntro } from "./PublicPage";
import { PublicIcon } from "./PublicIcon";
import styles from "./public-content.module.css";
export type LegalDocument = { title: string; description: string; sections: readonly { title: string; body: string }[] };
export function LegalDraftNotice() {
  return <aside className={styles.notice} aria-label="Estado del borrador legal"><p className={styles.noticeTitle}><PublicIcon name="alert"/>Pendiente de revisión legal</p><p className={styles.muted}>Borrador exclusivamente para revisión de desarrollo. D08 pendiente: responsable, jurisdicción, contacto, proveedores y políticas definitivas necesitan aprobación. No autoriza un despliegue comercial.</p></aside>;
}
export function LegalPage({ document, children }: { document: LegalDocument; children?: React.ReactNode }) {
  return <PublicPage><PublicPageIntro eyebrow="INFORMACIÓN LEGAL / BORRADOR" title={document.title} description={document.description}/><LegalDraftNotice/>
    <div className={styles.legalReading}>{document.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p className={styles.muted}>{section.body}</p></section>)}</div>{children}
  </PublicPage>;
}
