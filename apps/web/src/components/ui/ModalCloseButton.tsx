"use client";
import { Button, type ButtonProps } from "./Button";
import { useModalCloseRequest } from "./internal/ModalCore";

export function ModalCloseButton({ onClick, ...props }: Omit<ButtonProps, "type"> & { type?: "button" }) {
  const requestClose = useModalCloseRequest();
  return <Button {...props} onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) requestClose({ reason: "button" });
  }} />;
}
