"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { publicRoutes } from "@/lib/navigation/public-routes";

/** Missing URLs may reload the document; the 404 also mounts this focus boundary. */
export function RouteFocus({ focusOnMount = false }: { focusOnMount?: boolean }) {
  const path = usePathname();
  const previous = useRef(path);
  useEffect(() => {
    const changed = path !== previous.current;
    previous.current = path;
    if (!changed && !focusOnMount) return;
    if (!publicRoutes.some((route) => route.href === path)) return;
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>("main")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [path, focusOnMount]);
  return null;
}
