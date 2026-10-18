import Image from "next/image";
import styles from "./modal-feedback.module.css";
export type ToastTone = "neutral" | "success" | "warning" | "error";
export type ToastProps = { tone?: ToastTone; label: string };

/** Presentational only; ToastRegion owns the single announcement surface. */
export function Toast({ tone = "neutral", label }: ToastProps) {
  return <div className={styles.toast} data-tone={tone}>
    <Image unoptimized src={`/public-content/${tone === "neutral" || tone === "success" ? "check" : "alert"}.svg`} alt="" width={24} height={24} />
    <p>{label}</p>
  </div>;
}
