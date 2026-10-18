"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { canFocus, tabStops } from "./modal-focus";

export type ModalCloseReason = "escape" | "scrim" | "button" | "form" | "native" | "open-rejected";
export type ModalCloseRequest = { reason: ModalCloseReason; returnValue?: string };
export type ModalName = { label: string; labelledBy?: never } | { labelledBy: string; label?: never };
export type ModalCoreProps = ModalName & {
  id: string; open: boolean; onCloseRequest: (request: ModalCloseRequest) => void;
  initialFocus?: () => HTMLElement | null; returnFocus?: () => HTMLElement | null;
  describedBy?: string; children: ReactNode; className: string; panelClassName: string;
  /** Internal compatibility option: only the approved public M10 uses a delay. */
  closeDelayMs?: number;
};

const CloseContext = createContext<((request: ModalCloseRequest) => void) | null>(null);
export function useModalCloseRequest() {
  const request = useContext(CloseContext);
  if (!request) throw new Error("ModalCloseButton requires Dialog, Drawer or ModalSurface");
  return request;
}

/** One owner for the native modal layer, scroll and focus; no stacking or queue. */
export function ModalCore(props: ModalCoreProps) {
  const { id, open, children, className, panelClassName, label, labelledBy, describedBy } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const active = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { latest.current = props; });

  function focusInitial(node: HTMLDialogElement) {
    const supplied = latest.current.initialFocus?.() ?? node.querySelector<HTMLElement>("[data-modal-initial-focus]");
    const target = supplied && node.contains(supplied) && canFocus(supplied) ? supplied : panel.current;
    target?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    if (document.querySelector("dialog:modal")) {
      latest.current.onCloseRequest({ reason: "open-rejected" });
      return;
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const position = { x: window.scrollX, y: window.scrollY };
    const owned = ["overflow", "position", "top", "left", "right", "width"];
    const previous = owned.map((key) => [key, document.body.style.getPropertyValue(key), document.body.style.getPropertyPriority(key)]);
    delete node.dataset.closing;
    node.returnValue = "";
    node.showModal();
    active.current = true;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${position.y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    focusInitial(node);
    return () => {
      active.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      node.close();
      delete node.dataset.closing;
      for (const [key, value, priority] of previous) {
        if (value) document.body.style.setProperty(key, value, priority);
        else document.body.style.removeProperty(key);
      }
      window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
      const supplied = latest.current.returnFocus?.();
      const target = canFocus(supplied ?? null) ? supplied : previousFocus;
      if (canFocus(target ?? null)) target?.focus({ preventScroll: true });
    };
  }, [open]);

  function requestClose(request: ModalCloseRequest) {
    if (!active.current || timer.current !== null) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : latest.current.closeDelayMs ?? 0;
    if (!duration) { latest.current.onCloseRequest(request); return; }
    if (dialog.current) dialog.current.dataset.closing = "true";
    timer.current = setTimeout(() => {
      timer.current = null;
      if (dialog.current) delete dialog.current.dataset.closing;
      latest.current.onCloseRequest(request);
    }, duration);
  }

  return <dialog ref={dialog} id={id} aria-label={label} aria-labelledby={labelledBy}
    aria-describedby={describedBy} aria-modal="true" className={className}
    onCancel={(event) => { event.preventDefault(); requestClose({ reason: "escape" }); }}
    onClick={(event) => { if (event.target === event.currentTarget) requestClose({ reason: "scrim" }); }}
    onClose={(event) => {
      if (!active.current || !latest.current.open || event.currentTarget.open) return;
      latest.current.onCloseRequest({ reason: "native", returnValue: event.currentTarget.returnValue });
      queueMicrotask(() => {
        const node = dialog.current;
        if (active.current && latest.current.open && node?.isConnected && !node.open) {
          node.showModal(); focusInitial(node);
        }
      });
    }}
    onSubmit={(event) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const method = submitter?.getAttribute("formmethod") ?? event.target.method;
      if (method.toLowerCase() !== "dialog") return;
      event.preventDefault();
      requestClose({ reason: "form", returnValue: submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter.value : "" });
    }}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const items = tabStops(event.currentTarget);
      const first = items[0], last = items.at(-1);
      const current = document.activeElement;
      if (!first || (event.shiftKey && (current === first || !items.includes(current as HTMLElement))) || (!event.shiftKey && current === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
        if (!first) panel.current?.focus();
      }
    }}>
    <CloseContext value={requestClose}><div ref={panel} tabIndex={-1} className={panelClassName}>{children}</div></CloseContext>
  </dialog>;
}
