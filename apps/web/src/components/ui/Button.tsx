import type { ComponentPropsWithoutRef } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; loading?: boolean };

/** Native button; caller-owned interactions stay in the caller's client boundary. */
export function Button({ variant = "primary", loading = false, disabled = false, type = "button", className, children, ...props }: ButtonProps) {
  if (!["primary", "secondary", "tertiary", "destructive"].includes(variant)) throw new Error("Unapproved Button variant");
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      data-loading={loading || undefined} data-variant={variant}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}>
      {children}
    </button>
  );
}
