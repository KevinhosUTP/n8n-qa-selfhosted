"use client";

import Image from "next/image";
import type { ComponentPropsWithRef } from "react";
import { Field, descriptionIds, useFieldId, type FieldContent } from "./Field";
import styles from "./fields.module.css";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<ComponentPropsWithRef<"select">, "children" | "multiple" | "size" | "value" | "defaultValue"> & FieldContent & {
  options: readonly SelectOption[]; value?: string; defaultValue?: string;
};
type Presentation = { appearance?: "select" | "history" | "report"; applied?: boolean };

/** One native single select, including history and report presentations. */
export function SelectControl({ id: suppliedId, label, hint, error, required, disabled, className, options, appearance = "select", applied, "aria-describedby": describedBy, "aria-invalid": invalid, ...native }: SelectFieldProps & Presentation) {
  const id = useFieldId(suppliedId);
  return <Field {...{ id, label, hint, error, required, disabled, className, appearance, applied }}>
    <div className={styles.controlBox}>
      <select {...native} id={id} required={required} disabled={disabled} className={styles.control}
        aria-describedby={descriptionIds(id, hint, error, describedBy)} aria-invalid={error ? true : invalid}>
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      {appearance !== "select" ? <Image unoptimized src={`/shared-ui/chevron-${appearance === "history" ? 20 : 16}.svg`} alt="" width={appearance === "history" ? 20 : 16} height={appearance === "history" ? 20 : 16} className={styles.selectIcon} /> : null}
    </div>
  </Field>;
}

export function SelectField(props: SelectFieldProps) { return <SelectControl {...props} />; }
