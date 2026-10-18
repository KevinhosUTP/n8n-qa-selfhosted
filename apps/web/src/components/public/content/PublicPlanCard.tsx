import { plans, commercialNotice } from "@/lib/content/public/content";
import { Button } from "@/components/ui/Button";
import styles from "./public-content.module.css";
export function PublicPlanCards() {
  return <div className={styles.plans}>{plans.map((plan) => <article key={plan.name} className={[styles.card, styles.plan, plan.recommended ? styles.recommended : ""].join(" ")} aria-label={`Plan ${plan.name} propuesto`}>
    <p className={plan.recommended ? styles.accentSmall : styles.smallStrong}>{plan.recommended ? "RECOMENDADO · DESARROLLADORES ACTIVOS" : "1 USUARIO · 4 MOTORES QA · PROPUESTA"}</p>
    <h3>{plan.name}</h3><p className={styles.cardTitle}>Precio por definir</p>
    <p><strong>{plan.quota} auditorías / mes propuestas</strong></p>
    <p className={styles.muted}>{plan.days} días de historial propuestos</p>
    <p className={styles.small}>1 análisis simultáneo propuesto{plan.name === "Power" ? " · hasta 2 solo tras pruebas de carga y aprobación" : ""}</p>
    <p className={styles.small}>1 usuario · 4 motores QA previstos</p>
    <div className={styles.planAction}><Button disabled variant={plan.recommended ? "primary" : "secondary"} aria-describedby={`plan-${plan.name}-pending`}>{plan.name} pendiente</Button><p id={`plan-${plan.name}-pending`} className={styles.small}>Propuesta · sin contratación disponible</p></div>
  </article>)}</div>;
}
export function CommercialNotice() { return <p className={styles.proposal}>{commercialNotice}</p>; }
