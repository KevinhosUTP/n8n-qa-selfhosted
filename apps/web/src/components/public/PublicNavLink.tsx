"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { isCurrentPublicRoute, type PublicHref } from "@/lib/navigation/public-routes";
import styles from "./public-navigation.module.css";

type Props = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: PublicHref;
  variant?: "primary" | "secondary" | "tertiary";
};
export function PublicNavLink({ href, variant = "tertiary", className, ...props }: Props) {
  const pathname = usePathname();
  return <Link {...props} href={href} prefetch={false} data-variant={variant}
    aria-current={isCurrentPublicRoute(pathname, href) ? "page" : undefined}
    className={buttonClasses(variant, [styles.link, className].filter(Boolean).join(" "))} />;
}
