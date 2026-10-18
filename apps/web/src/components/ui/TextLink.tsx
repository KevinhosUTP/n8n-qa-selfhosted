import Link from "next/link";
import type { ComponentPropsWithRef } from "react";
import styles from "./shared-ui.module.css";

export type TextLinkProps = Omit<ComponentPropsWithRef<typeof Link>, "href"> & (
  { disabled?: false; href: ComponentPropsWithRef<typeof Link>["href"] } |
  { disabled: true; href?: never }
);

/** A disabled destination has no href, handler, tab stop or navigation behavior. */
export function TextLink({ disabled, href, className, children, ...props }: TextLinkProps) {
  const classes = [styles.textLink, className].filter(Boolean).join(" ");
  if (disabled) return <span id={props.id} title={props.title} lang={props.lang} dir={props.dir}
    aria-label={props["aria-label"]} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]}
    aria-disabled="true" className={classes}>{children}</span>;
  return <Link {...props} href={href!} className={classes}>{children}</Link>;
}
