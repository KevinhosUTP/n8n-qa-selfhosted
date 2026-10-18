"use client";

import Image from "next/image";
import type { ComponentPropsWithRef } from "react";
import { Field, descriptionIds, useFieldId, type FieldContent } from "./Field";
import styles from "./fields.module.css";

export type InputProps = Omit<ComponentPropsWithRef<"input">, "size" | "type"> & FieldContent & {
  type?: "text" | "search" | "email" | "password" | "url" | "tel" | "number";
  validation?: "success";
};
type Presentation = { appearance?: "input" | "history"; applied?: boolean };

/** Internal presentation reuse for the original history field; no second input. */
export function InputControl({ id: suppliedId, label, hint, error, required, disabled, className, validation, type = "text", appearance = "input", applied, "aria-describedby": describedBy, "aria-invalid": invalid, ...native }: InputProps & Presentation) {
  const id = useFieldId(suppliedId);
  return <Field {...{ id, label, hint, error, required, disabled, appearance, applied, className }}>
    <div className={styles.controlBox}>
      {appearance === "history" ? <Image unoptimized src="/shared-ui/search-20.svg" alt="" width={20} height={20} className={styles.leadingIcon} /> : null}
      <input {...native} id={id} type={type} required={required} disabled={disabled}
        aria-describedby={descriptionIds(id, hint, error, describedBy)} aria-invalid={error ? true : invalid}
        data-validation={validation} className={styles.control} />
    </div>
  </Field>;
}

export function Input(props: InputProps) { return <InputControl {...props} />; }
