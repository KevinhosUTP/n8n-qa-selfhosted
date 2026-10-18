import { PublicIcon } from "./PublicIcon";
import { Button } from "@/components/ui/Button";
import styles from "./public-content.module.css";
export function DemoReportPreview() {
  return <section className={[styles.card, styles.report].join(" ")} aria-label="Informe de ejemplo DEMO">
    <p className={styles.demo}><PublicIcon name="workflow"/>Informe de ejemplo · DEMO</p>
    <h2 className={styles.cardTitle}>Onboarding de clientes</h2>
    <p className={styles.small}>24 nodos · 28 conexiones · Perfil DEMO</p>
    <dl className={styles.reportStats}>
      <div><dt>Crítico</dt><dd className={styles.critical}>1</dd></div>
      <div><dt>Advertencias</dt><dd className={styles.warning}>2</dd></div>
      <div><dt>Comprobaciones OK</dt><dd className={styles.success}>18</dd></div>
    </dl>
    <div className={styles.finding}><p className={styles.critical}>SEC-001 / Ciberseguridad e Integraciones</p><p>Posible secreto incrustado</p><p className={styles.small}>Authorization: Bearer [REDACTADO]</p></div>
    <ul className={styles.reportEngines}><li>Lógica y Flujo de Datos · conexiones y referencias</li><li>Ciberseguridad e Integraciones · señales estáticas de riesgo</li><li>Arquitectura y Escalabilidad · reintentos y errores</li><li>Prompt Engineering y Agentes IA · instrucciones y agentes IA</li></ul>
    <Button disabled variant="secondary" className={styles.reportAction}>Explorar informe de ejemplo · pendiente</Button>
    <p className={styles.small}>Datos ficticios para explicar la lectura. No es el resultado de una auditoría real. El informe interactivo todavía no está disponible.</p>
  </section>;
}
