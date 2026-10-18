import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PublicNavLink } from "@/components/public/PublicNavLink";
import { PublicPage, PublicPageIntro } from "@/components/public/content/PublicPage";
import { PublicPlanCards, CommercialNotice } from "@/components/public/content/PublicPlanCard";
import { PublicIcon } from "@/components/public/content/PublicIcon";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "Planes propuestos · KevoLint" };
export default function PricingPage() {
  return <PublicPage><PublicPageIntro eyebrow="PLANES Y CONSUMO" title={<>La misma revisión.<br/>Más capacidad cuando la necesitas.</>} description="El diseño propone cuatro motores QA y hallazgos completos en todos los planes. Cuotas e historial necesitan aprobación; no son servicios disponibles."/>
    <section className={[styles.card, styles.trial].join(" ")}><p className={styles.demo}><PublicIcon name="workflow"/>3 auditorías gratis · propuesta</p><h2>Prueba única, sin tarjeta.</h2><p className={styles.muted}>Propuesta: 3 análisis exitosos por cuenta, sin renovación automática ni ocultar hallazgos críticos. La prueba y la conservación Free no están aprobadas ni implementadas.</p><div className={styles.actions}><PublicNavLink href="/sign-up" variant="primary" aria-describedby="pricing-signup">Probar 3 auditorías gratis</PublicNavLink></div><p id="pricing-signup" className={styles.small}>Registro pendiente de PR06; /sign-up responde 404.</p></section>
    <section className={styles.section} aria-label="Planes propuestos"><CommercialNotice/><PublicPlanCards/></section>
    <section className={styles.card}><h2>Sin compras ficticias</h2><p className={styles.muted}>Precios, impuestos, proveedor de pago y condiciones están pendientes. La contratación solo se habilitará cuando estén aprobados y se implemente el recorrido real.</p><div className={styles.actions}><Button disabled variant="secondary" aria-describedby="no-beta">Unirme a beta · pendiente</Button><Button disabled variant="secondary" aria-describedby="no-beta">Cambio de plan · no disponible</Button></div><p id="no-beta" className={styles.small}>No se registra una suscripción, solicitud ni cambio de plan al visitar esta página.</p></section>
    <section className={styles.section}><h2>¿Cómo funcionarían los créditos?</h2><p className={styles.muted}>La propuesta es consumir uno por análisis completado, liberar reservas en errores y evitar cargos duplicados en reintentos idempotentes. Estos controles de backend todavía no están implementados y las condiciones finales no están aprobadas.</p></section>
    <aside className={styles.notice}><p className={styles.noticeTitle}><PublicIcon name="alert"/>Power: concurrencia condicionada</p><p className={styles.muted}>Los 500 análisis mensuales y 180 días de historial son propuestas. Hasta 2 análisis simultáneos requerirían pruebas de carga y aprobación; no se ofrecen como capacidad operativa.</p></aside>
  </PublicPage>;
}
