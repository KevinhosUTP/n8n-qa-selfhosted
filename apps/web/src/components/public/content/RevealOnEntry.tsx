"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./public-content.module.css";

// Browser-document lifetime only; no storage, request state or persistence.
const heroDocuments = new WeakSet<Document>();
export function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.dataset.hero = heroDocuments.has(document) || matchMedia("(prefers-reduced-motion: reduce)").matches ? "complete" : "animate";
    heroDocuments.add(document);
    return () => { delete element.dataset.hero; };
  }, []);
  return <h1 ref={ref} id="hero-title" className={styles.heroTitle}><span>Entrega </span><span>workflows</span><br/><span>con más confianza.</span></h1>;
}

/** Visible SSR fallback; only offscreen content is prepared for its first entry. */
export function RevealOnEntry({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || media.matches || !("IntersectionObserver" in window)) return;
    let observer: IntersectionObserver | undefined;
    const show = () => { element.dataset.enter = "visible"; observer?.disconnect(); };
    if (element.getBoundingClientRect().top >= innerHeight) {
      element.dataset.enter = "pending";
      observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) show(); }, { threshold: 0.05 });
      observer.observe(element);
    }
    const onMotion = () => { if (media.matches) show(); };
    element.addEventListener("focusin", show);
    media.addEventListener("change", onMotion);
    return () => { observer?.disconnect(); element.removeEventListener("focusin", show); media.removeEventListener("change", onMotion); delete element.dataset.enter; };
  }, []);
  return <div ref={ref} className={[styles.reveal, className].filter(Boolean).join(" ")}>{children}</div>;
}
