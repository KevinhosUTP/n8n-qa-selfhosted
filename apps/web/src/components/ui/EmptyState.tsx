import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "./Card";
import styles from "./shared-ui.module.css";

export function EmptyState({ title, children, action, headingLevel = 2 }: { title: string; children: ReactNode; action?: ReactNode; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <Card className={styles.empty}>
    <Image unoptimized src="/public-content/file.svg" alt="" width={24} height={24} />
    <Heading className={styles.emptyTitle}>{title}</Heading><div className={styles.emptyBody}>{children}</div>
    {action}
  </Card>;
}
