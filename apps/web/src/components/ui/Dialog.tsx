"use client";
import { useId, useRef, type ReactNode } from "react";
import { ModalCore, type ModalCloseRequest } from "./internal/ModalCore";
import styles from "./modal-feedback.module.css";

export type DialogProps = {
  id?: string; open: boolean; onCloseRequest: (request: ModalCloseRequest) => void;
  title: string; description?: string; children?: ReactNode; actions?: ReactNode;
  initialFocus?: () => HTMLElement | null; returnFocus?: () => HTMLElement | null;
};
export function Dialog({ id: suppliedId, title, description, children, actions, initialFocus, ...props }: DialogProps) {
  const generatedId = useId();
  const id = suppliedId ?? `dialog-${generatedId}`;
  const heading = useRef<HTMLHeadingElement>(null);
  return <ModalCore {...props} id={id} labelledBy={`${id}-title`} describedBy={description ? `${id}-description` : undefined}
    initialFocus={initialFocus ?? (() => heading.current)} className={styles.modal} panelClassName={styles.dialog}>
    <h2 ref={heading} tabIndex={-1} id={`${id}-title`} className={styles.title}>{title}</h2>
    {description ? <p id={`${id}-description`} className={styles.description}>{description}</p> : null}
    {children}
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </ModalCore>;
}
