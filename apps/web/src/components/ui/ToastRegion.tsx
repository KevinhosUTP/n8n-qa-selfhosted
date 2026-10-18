import { Toast, type ToastProps } from "./Toast";
export type ToastMessage = ToastProps & { id: string };

/** Mount empty before events; the caller owns messages/removal, not a timer or queue. */
export function ToastRegion({ message }: { message: ToastMessage | null }) {
  return <div role="status" aria-live="polite" aria-atomic="true" data-toast-region>
    {message ? <Toast key={message.id} tone={message.tone} label={message.label} /> : null}
  </div>;
}
