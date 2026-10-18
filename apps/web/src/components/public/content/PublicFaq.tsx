import type { HelpEntry } from "@/lib/content/public/content";
import styles from "./public-content.module.css";
/** Native disclosure works by pointer, Enter/Space and without JavaScript. */
export function PublicFaq({ entries }: { entries: readonly HelpEntry[] }) {
  return <div className={styles.faq}>{entries.map((entry) => <details key={entry.id} open className={styles.disclosure}><summary>{entry.question}</summary><p className={styles.answer}>{entry.answer}</p></details>)}</div>;
}
