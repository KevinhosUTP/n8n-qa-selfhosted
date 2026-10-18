import { PublicIcon, type PublicIconName } from "./PublicIcon";
import styles from "./public-content.module.css";
export function ProcessSteps({ steps, four = false }: { steps: readonly { icon: PublicIconName; title: string; description: string }[]; four?: boolean }) {
  const Heading = four ? "h2" : "h3";
  return <ol className={four ? styles.fourSteps : styles.steps}>{steps.map((step) => <li key={step.title} className={styles.card}><PublicIcon name={step.icon}/><Heading className={styles.cardTitle}>{step.title}</Heading><p className={styles.muted}>{step.description}</p></li>)}</ol>;
}
