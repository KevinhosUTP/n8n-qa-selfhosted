import type { ComponentPropsWithRef } from "react";
import styles from "./shared-ui.module.css";
/** Structural surface only; semantic headings and editorial layout belong to callers. */
export function Card({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={[styles.card, className].filter(Boolean).join(" ")} />;
}
