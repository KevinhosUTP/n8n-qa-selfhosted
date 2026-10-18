import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
/** Share visual states with semantic navigation anchors, without polymorphic buttons. */
export function buttonClasses(variant: ButtonVariant, className?: string) {
  if (!["primary", "secondary", "tertiary", "destructive"].includes(variant)) throw new Error("Unapproved Button variant");
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}
