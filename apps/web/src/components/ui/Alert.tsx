import Image from "next/image";
import type { ReactNode } from "react";
import type { BadgeTone } from "./Badge";
import styles from "./shared-ui.module.css";

export type AlertProps = { tone: Exclude<BadgeTone, "muted">; title: string; children: ReactNode; announce?: "off" | "polite" | "assertive"; className?: string };
export function Alert({ tone, title, children, announce = "off", className }: AlertProps) {
  return <div className={[styles.alert, styles[tone], className].filter(Boolean).join(" ")}
    role={announce === "assertive" ? "alert" : announce === "polite" ? "status" : undefined} aria-atomic={announce !== "off" || undefined}>
    <Image unoptimized src={`/shared-ui/${tone === "success" ? "check" : "alert"}-22.svg`} alt="" width={22} height={22} />
    <div><p className={styles.alertTitle}>{title}</p><div className={styles.alertBody}>{children}</div></div>
  </div>;
}
