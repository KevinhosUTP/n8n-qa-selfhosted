import type { Metadata } from "next";
import { PublicNavLink } from "@/components/public/PublicNavLink";
import { PublicPage } from "@/components/public/content/PublicPage";
import { DemoReportPreview } from "@/components/public/content/DemoReportPreview";
import { ProcessSteps } from "@/components/public/content/ProcessSteps";
import { QAMotorCards } from "@/components/public/content/QAMotorCard";
import { PublicPlanCards, CommercialNotice } from "@/components/public/content/PublicPlanCard";
import { PublicFaq } from "@/components/public/content/PublicFaq";
import { RevealOnEntry, HeroTitle } from "@/components/public/content/RevealOnEntry";
import { landingSteps, landingFaq } from "@/lib/content/public/content";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "KevoLint · QA estática para workflows de n8n", description: "Revisa señales estáticas de riesgo en workflows de n8n. Interfaz pública en desarrollo." };
export default function LandingPage() {
  return <PublicPage landing>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}><p className={styles.eyebrow}>QA ESTÁTICO PARA WORKFLOWS DE n8n</p>
        <HeroTitle/>
        <p className={styles.muted}>Detecta riesgos potenciales y mejora tu workflow antes de publicarlo. Importa un JSON y entiende qué revisar, por qué y cómo corregirlo.</p>
        <div className={styles.actions}><PublicNavLink href="/sign-up" variant="primary" aria-describedby="trial-pending">Probar 3 auditorías gratis</PublicNavLink><PublicNavLink href="/como-funciona" variant="secondary">Cómo funciona</PublicNavLink></div>
        <p id="trial-pending" className={styles.small}>Propuesta: sin tarjeta · 3 auditorías exitosas · una sola vez. Registro e importación pendientes; /sign-up todavía responde 404.</p>
        <div className={styles.guarantees}><p>✓ Sin ejecutar tu workflow</p><p>✓ Hallazgos críticos visibles en el ejemplo DEMO</p></div>
      </div><DemoReportPreview/>
    </section>
    <RevealOnEntry><section className={styles.section} aria-labelledby="steps-title"><h2 id="steps-title" className={styles.sectionTitle}>De JSON a mejoras concretas</h2><p className={styles.muted}>Un recorrido previsto para revisar tu trabajo antes de entregar. La importación y el informe interactivo se incorporarán en próximas etapas.</p><ProcessSteps steps={landingSteps}/></section></RevealOnEntry>
    <RevealOnEntry><section className={styles.section} aria-labelledby="motors-title"><h2 id="motors-title" className={styles.sectionTitle}>Una revisión, cuatro perspectivas.</h2><p className={styles.muted}>Cuatro categorías del motor estático. Su presencia en planes futuros no significa que las suscripciones estén disponibles.</p><QAMotorCards/></section></RevealOnEntry>
    <RevealOnEntry><section className={styles.card}><h2 className={styles.cardTitle}>Tu archivo no tiene que quedarse.</h2><p className={styles.muted}>La API inspeccionada no implementa persistencia. El historial, la conservación y el tratamiento completo de datos siguen pendientes de validación.</p><div className={styles.actions}><PublicNavLink href="/legal/privacidad" variant="secondary">Conoce el tratamiento de datos</PublicNavLink></div></section></RevealOnEntry>
    <RevealOnEntry><section className={styles.section} aria-labelledby="plans-title"><h2 id="plans-title" className={styles.sectionTitle}>Elige cuánto necesitas auditar.</h2><p className={styles.muted}>Precios en investigación. Presentación de planes propuestos, sin cobros ni contratación.</p><CommercialNotice/><PublicPlanCards/><div className={styles.actions}><PublicNavLink href="/precios" variant="secondary">Comparar todos los planes</PublicNavLink></div></section></RevealOnEntry>
    <RevealOnEntry><section className={styles.section} aria-labelledby="faq-title"><h2 id="faq-title" className={styles.sectionTitle}>Lo que conviene saber.</h2><p className={styles.muted}>Un análisis estático ayuda a detectar riesgos; no garantiza ausencia de problemas.</p><PublicFaq entries={landingFaq}/><div className={styles.actions}><PublicNavLink href="/ayuda" variant="secondary">Ver toda la ayuda</PublicNavLink></div></section></RevealOnEntry>
  </PublicPage>;
}
