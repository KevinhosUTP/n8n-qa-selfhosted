"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "../public-navigation.module.css";

type Props = {
  id: string;
  open: boolean;
  onDismiss: () => void;
  returnFocus: () => HTMLElement | null;
  children: ReactNode;
};

const DismissContext = createContext<(() => void) | null>(null);
export function ModalCloseButton({ className }: { className?: string }) {
  const dismiss = useContext(DismissContext);
  if (!dismiss) throw new Error("ModalCloseButton requires ModalSurface");
  return <Button variant="secondary" className={className} data-modal-initial-focus onClick={dismiss}>Cerrar menú</Button>;
}

/** PR03 internal modal mechanics. PR05 may reuse this; no general dialog library. */
export function ModalSurface({ id, open, onDismiss, returnFocus, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacks = useRef({ onDismiss, returnFocus });
  useEffect(() => { callbacks.current = { onDismiss, returnFocus }; }, [onDismiss, returnFocus]);

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const position = { x: window.scrollX, y: window.scrollY };
    const owned = ["overflow", "position", "top", "left", "right", "width"];
    const previous = owned.map((key) => [key, document.body.style.getPropertyValue(key), document.body.style.getPropertyPriority(key)]);
    delete node.dataset.closing;
    node.showModal();
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${position.y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    node.querySelector<HTMLButtonElement>("[data-modal-initial-focus]")?.focus();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      node.close();
      for (const [key, value, priority] of previous) {
        if (value) document.body.style.setProperty(key, value, priority);
        else document.body.style.removeProperty(key);
      }
      window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
      const target = callbacks.current.returnFocus();
      if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true });
    };
  }, [open]);

  function dismiss() {
    if (timer.current) return;
    if (dialog.current) dialog.current.dataset.closing = "true";
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
    timer.current = setTimeout(() => {
      timer.current = null;
      callbacks.current.onDismiss();
    }, duration);
  }

  return <dialog ref={dialog} id={id} aria-label="Navegación pública" aria-modal="true"
    className={styles.modal}
    onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')]
        .filter((item) => item.getClientRects().length > 0);
      const first = items[0], last = items.at(-1);
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }}>
    <DismissContext value={dismiss}><div className={styles.panel}>{children}</div></DismissContext>
  </dialog>;
}
