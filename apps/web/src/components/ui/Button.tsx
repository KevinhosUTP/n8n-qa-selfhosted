import type { ComponentPropsWithRef } from "react";
import { buttonClasses, type ButtonVariant } from "./button-classes";

export type { ButtonVariant } from "./button-classes";
export type ButtonProps = ComponentPropsWithRef<"button"> & { variant?: ButtonVariant; loading?: boolean };

/** Native button; caller-owned interactions stay in the caller's client boundary. */
export function Button({ variant = "primary", loading = false, disabled = false, type = "button", className, children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      data-loading={loading || undefined} data-variant={variant}
      className={buttonClasses(variant, className)}>
      {children}
    </button>
  );
}
