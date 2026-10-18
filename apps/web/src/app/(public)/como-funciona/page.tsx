import type { Metadata } from "next";
import { PublicNavLink } from "@/components/public/PublicNavLink";
import { PublicPage, PublicPageIntro } from "@/components/public/content/PublicPage";
import { ProcessSteps } from "@/components/public/content/ProcessSteps";
import { DemoReportPreview } from "@/components/public/content/DemoReportPreview";
import { howSteps } from "@/lib/content/public/content";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "Cómo funciona · KevoLint" };
export default function HowItWorksPage() {
  return <PublicPage><PublicPageIntro eyebrow="CÓMO FUNCIONA" title="Tu workflow, revisado paso a paso." description="Auditoría estática: sin conexión a tu instancia y sin ejecutar código del workflow."/>
    <ProcessSteps steps={howSteps} four/>
    <div className={styles.split}><DemoReportPreview/><section className={styles.section}><h2>Contexto antes que alarmas.</h2><p className={styles.muted}>Una regla señala evidencia; tú decides cómo aplicarla en el contexto de tu workflow. Los resultados pueden incluir falsos positivos.</p><p className={styles.muted}>No se detectan todos los errores de ejecución ni se sustituyen pruebas funcionales, revisión manual o pruebas de seguridad.</p><div className={styles.actions}><PublicNavLink href="/sign-up" variant="primary" aria-describedby="how-signup">Iniciar mi prueba gratuita</PublicNavLink></div><p id="how-signup" className={styles.small}>Prueba propuesta y registro pendientes de implementación en PR06; el destino responde 404.</p></section></div>
    <aside className={styles.notice}><h2 className={styles.cardTitle}>Límites de importación</h2><p className={styles.muted}>La API actual admite solicitudes de hasta 1 MiB, 150 nodos y 2000 aristas. Solo JSON con estructura válida. La importación pública todavía no está disponible.</p></aside>
  </PublicPage>;
}
