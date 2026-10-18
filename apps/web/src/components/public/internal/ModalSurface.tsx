"use client";

import type { ReactNode } from "react";
import { ModalCore } from "@/components/ui/internal/ModalCore";
import { ModalCloseButton as SharedCloseButton } from "@/components/ui/ModalCloseButton";
import styles from "../public-navigation.module.css";

type Props = { id: string; open: boolean; onDismiss: () => void; returnFocus: () => HTMLElement | null; children: ReactNode };

/** PR03 compatibility adapter: naming, geometry and M10 remain public-specific. */
export function ModalCloseButton({ className }: { className?: string }) {
  return <SharedCloseButton variant="secondary" className={className} data-modal-initial-focus>Cerrar menú</SharedCloseButton>;
}

export function ModalSurface({ id, open, onDismiss, returnFocus, children }: Props) {
  return <ModalCore id={id} open={open} onCloseRequest={() => onDismiss()} returnFocus={returnFocus}
    label="Navegación pública" className={styles.modal} panelClassName={styles.panel} closeDelayMs={240}>
    {children}
  </ModalCore>;
}
