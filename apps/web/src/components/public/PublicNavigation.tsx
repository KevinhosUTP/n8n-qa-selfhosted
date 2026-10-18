"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { drawerRoutes, headerRoutes } from "@/lib/navigation/public-routes";
import { PublicNavLink } from "./PublicNavLink";
import { ModalSurface, ModalCloseButton } from "./internal/ModalSurface";
import styles from "./public-navigation.module.css";

export function PublicNavigation() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const navigated = useRef(false);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      navigated.current = true;
      setOpen(false);
    }
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  return <>
    <nav aria-label="Principal" className={styles.desktop}>
      {headerRoutes.map((route) => <PublicNavLink key={route.href} href={route.href}
        variant={route.href === "/sign-up" ? "primary" : route.href === "/sign-in" ? "secondary" : "tertiary"}>
        {route.label}
      </PublicNavLink>)}
    </nav>
    <Button ref={trigger} className={styles.trigger} variant="secondary" aria-label="Abrir menú"
      aria-expanded={open} aria-controls="public-navigation-drawer" aria-haspopup="dialog"
      onClick={() => { navigated.current = false; setOpen(true); }}>
      <Image unoptimized loading="eager" src="/navigation/menu.svg" alt="" width={24} height={24} className={styles.menuIcon} />
    </Button>
    <ModalSurface id="public-navigation-drawer" open={open} onDismiss={() => setOpen(false)} returnFocus={() => {
      if (navigated.current) {
        // A real App Router destination may commit while the native dialog still
        // makes it inert. Settle focus after close(), which can restore the trigger.
        window.scrollTo({ left: 0, top: 0, behavior: "instant" });
        return document.querySelector<HTMLElement>("main");
      }
      return trigger.current?.getClientRects().length ? trigger.current : document.querySelector<HTMLElement>("[data-public-home]");
    }}>
      <>
        <div className={styles.drawerHeading}>
          <BrandLogo composition="Wordmark" loading="eager" />
          <ModalCloseButton className={styles.close} />
        </div>
        <nav aria-label="Menú público" className={styles.drawerLinks}>
          {drawerRoutes.map((route) => <PublicNavLink key={route.href} href={route.href}
            variant={route.href === "/sign-up" ? "primary" : "tertiary"}
            onClick={(event) => {
              if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && route.href === pathname) {
                event.preventDefault();
                setOpen(false);
              }
            }}>{route.label}</PublicNavLink>)}
        </nav>
        <p className={styles.hint}>Pulsa Escape para cerrar el menú.</p>
      </>
    </ModalSurface>
  </>;
}
