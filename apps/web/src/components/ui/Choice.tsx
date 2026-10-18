"use client";

import type { ComponentPropsWithRef } from "react";
import { descriptionIds, useFieldId, type FieldContent } from "./Field";
import styles from "./fields.module.css";

export type ChoiceProps = Omit<ComponentPropsWithRef<"input">, "type" | "role" | "readOnly" | "children"> & FieldContent;

export function Choice({ kind, id: suppliedId, label, hint, error, required, className, "aria-describedby": describedBy, "aria-invalid": invalid, ...native }: ChoiceProps & { kind: "radio" | "checkbox" | "switch" }) {
  const id = useFieldId(suppliedId);
  return <div className={[styles.choiceField, className].filter(Boolean).join(" ")}>
    <label htmlFor={id} className={[styles.choice, styles[kind]].join(" ")}>
      <input {...native} id={id} type={kind === "radio" ? "radio" : "checkbox"} role={kind === "switch" ? "switch" : undefined}
        required={required} aria-invalid={error ? true : invalid} aria-describedby={descriptionIds(id, hint, error, describedBy)} />
      <span>{label}{required ? " (obligatorio)" : ""}</span>
    </label>
    {hint ? <p id={`${id}-hint`} className={styles.hint}>{hint}</p> : null}
    {error ? <p id={`${id}-error`} className={styles.error}>{error}</p> : null}
  </div>;
}
