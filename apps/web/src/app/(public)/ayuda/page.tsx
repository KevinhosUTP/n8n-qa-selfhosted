import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PublicPage, PublicPageIntro } from "@/components/public/content/PublicPage";
import { HelpSearch } from "@/components/public/content/HelpSearch";
import { helpEntries, readHelpQuery } from "@/lib/content/public/content";
import styles from "@/components/public/content/public-content.module.css";
export const metadata: Metadata = { title: "Ayuda · KevoLint" };
export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
 const query = readHelpQuery((await searchParams).q);
 return <PublicPage><PublicPageIntro eyebrow="CENTRO DE AYUDA" title="Resuelve tu siguiente paso." description="Guías breves para entender la importación, el análisis y sus límites."/>
   <HelpSearch key={query} entries={helpEntries} initialQuery={query}/>
   <section className={styles.card}><h2 className={styles.cardTitle}>¿Necesitas una revisión adicional?</h2><p id="help-account-pending" className={styles.muted}>Correo de soporte pendiente de definir antes de la beta. La recuperación de cuenta todavía no está disponible; se implementará con la autenticación de PR06.</p><Button disabled variant="secondary" aria-describedby="help-account-pending">Recuperar acceso · pendiente</Button></section>
 </PublicPage>;
}
