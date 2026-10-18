import type { ReactNode } from "react";
import styles from "./public-layout.module.css";

export function PublicContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.container, className].filter(Boolean).join(" ")}>{children}</div>;
}
