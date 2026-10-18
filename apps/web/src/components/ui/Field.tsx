"use client";

import { useId, type ReactNode } from "react";
import styles from "./fields.module.css";

export type FieldContent = { label: string; hint?: string; error?: string };
export type FieldAppearance = "input" | "select" | "history" | "report";

/** Merge caller descriptions with the persistent hint and current error. */
export function descriptionIds(id: string, hint?: string, error?: string, external?: string) {
  return [...new Set([external, hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
    .filter(Boolean).join(" ").split(/\s+/).filter(Boolean))].join(" ") || undefined;
}

export function useFieldId(id?: string) {
  const generated = useId();
  return id ?? `field-${generated}`;
}

type Props = FieldContent & { id: string; required?: boolean; disabled?: boolean; appearance?: FieldAppearance; applied?: boolean; className?: string; children: ReactNode };

/** Field owns labeling/messages; the child remains a native form control. */
export function Field({ id, label, hint, error, required, disabled, appearance = "input", applied, className, children }: Props) {
  return <div className={[styles.field, styles[appearance], className].filter(Boolean).join(" ")}
    data-invalid={!!error || undefined} data-disabled={disabled || undefined} data-applied={applied || undefined}>
    <label htmlFor={id} className={styles.label}>{label}{required ? <span className={styles.required}> (obligatorio)</span> : null}</label>
    {children}
    {hint ? <p id={`${id}-hint`} className={styles.hint}>{hint}</p> : null}
    {error ? <p id={`${id}-error`} className={styles.error}>{error}</p> : null}
  </div>;
}
