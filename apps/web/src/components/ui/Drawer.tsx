"use client";
import { useId, useRef } from "react";
import type { DialogProps } from "./Dialog";
import { ModalCore } from "./internal/ModalCore";
import styles from "./modal-feedback.module.css";

/** Filter-panel presentation from 114:14466/14518; no business filters or side variants. */
export function Drawer({ id: suppliedId, title, description, children, actions, initialFocus, ...props }: DialogProps) {
  const generatedId = useId();
  const id = suppliedId ?? `drawer-${generatedId}`;
  const heading = useRef<HTMLHeadingElement>(null);
  return <ModalCore {...props} id={id} labelledBy={`${id}-title`} describedBy={description ? `${id}-description` : undefined}
    initialFocus={initialFocus ?? (() => heading.current)} className={styles.modal} panelClassName={styles.drawer}>
    <h2 ref={heading} tabIndex={-1} id={`${id}-title`} className={styles.title}>{title}</h2>
    {description ? <p id={`${id}-description`} className={styles.drawerDescription}>{description}</p> : null}
    {children}
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </ModalCore>;
}
