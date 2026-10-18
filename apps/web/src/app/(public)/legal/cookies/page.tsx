import type { Metadata } from "next";
import { LegalPage } from "@/components/public/content/LegalPage";
import { Button } from "@/components/ui/Button";
import { cookiesDraft } from "@/lib/content/public/legal-drafts";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "Cookies · Borrador de desarrollo · KevoLint", robots: { index: false, follow: false } };
export default function CookiesPage() { return <LegalPage document={cookiesDraft}><section className={styles.card} aria-label="Preferencias no disponibles"><p>Inventario de cookies pendiente de validación</p><label className={styles.reviewControl}><input type="checkbox" disabled/>Analítica opcional · no disponible</label><Button disabled variant="secondary" aria-describedby="cookies-pending">Guardar preferencias · pendiente</Button><p id="cookies-pending" className={styles.small}>No hay preferencias que guardar ni consentimiento implementado. Esta vista es exclusivamente un borrador de desarrollo.</p></section></LegalPage>; }
