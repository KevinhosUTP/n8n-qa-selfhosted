import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./shared-ui.module.css";

export type BadgeTone = "critical" | "warning" | "success" | "accent" | "muted";
const icons = { critical: "alert-16", warning: "alert-warning-16", success: "check-16", accent: "workflow-16", muted: "clock-16" };
export function Badge({ tone, children, className }: { tone: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} data-tone={tone}>
    <Image unoptimized src={`/shared-ui/${icons[tone]}.svg`} width={16} height={16} alt="" />{children}
  </span>;
}
