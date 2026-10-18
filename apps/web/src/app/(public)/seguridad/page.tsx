import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PublicNavLink } from "@/components/public/PublicNavLink";
import { PublicPage, PublicPageIntro } from "@/components/public/content/PublicPage";
import { PublicIcon, type PublicIconName } from "@/components/public/content/PublicIcon";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "Seguridad y límites · KevoLint" };
const measures: { icon: PublicIconName; title: string; body: string }[] = [
 { icon: "shield", title: "Análisis estático", body: "El motor inspecciona el JSON: no ejecuta el workflow ni abre conexiones a tu instancia de n8n." },
 { icon: "lock", title: "Evidencia sanitizada", body: "Las reglas revisadas señalan el tipo y la ubicación del posible secreto. La muestra DEMO usa evidencia redactada; esto no certifica todo el tratamiento de datos." },
 { icon: "clock", title: "Retención explícita", body: "El historial por plan y su conservación siguen pendientes. La API inspeccionada no implementa persistencia; logs y respaldos requieren validación independiente." },
];
export default function SecurityPage() {
 return <PublicPage><PublicPageIntro eyebrow="SEGURIDAD Y PRIVACIDAD" title="Transparencia desde el primer archivo." description="El alcance de protección debe ser comprensible y verificable. Sin sellos de certificación ni garantías absolutas."/>
   <div className={styles.steps}>{measures.map((measure) => <section key={measure.title} className={styles.card}><PublicIcon name={measure.icon}/><h2 className={styles.cardTitle}>{measure.title}</h2><p className={styles.muted}>{measure.body}</p></section>)}</div>
   <section className={styles.card}><h2 className={styles.cardTitle}>Diseño previsto para la beta</h2><p className={styles.muted}>Identidad con Clerk, autorización por propietario, cifrado en tránsito y tratamiento mínimo de archivos forman parte del diseño previsto. Su funcionamiento requiere implementación y validación; no se declaran aquí como medidas operativas verificadas.</p><hr/><p className={styles.warning}>Pendiente de validar</p><p className={styles.muted}>Versiones compatibles, pruebas de carga de Power, proveedor de pagos y textos legales. No se declara SOC 2 ni ISO 27001.</p></section>
   <section className={styles.section}><h2>Qué no promete este servicio</h2><p className={styles.muted}>No certifica un workflow como 100% seguro ni identifica todos los fallos posibles. Revisa y prueba cada recomendación en tu entorno.</p><div className={styles.actions}><PublicNavLink href="/legal/privacidad" variant="secondary">Leer borrador de privacidad</PublicNavLink><Button disabled variant="secondary" aria-describedby="security-contact">Reportar una vulnerabilidad</Button></div><p id="security-contact" className={styles.small}>Canal de reporte pendiente de definir y aprobar. Este botón no envía información.</p></section>
 </PublicPage>;
}
