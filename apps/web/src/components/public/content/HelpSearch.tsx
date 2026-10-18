"use client";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PublicNavLink } from "@/components/public/PublicNavLink";
import { filterHelp, readHelpQuery, type HelpEntry } from "@/lib/content/public/content";
import styles from "./public-content.module.css";
export function HelpSearch({ entries, initialQuery }: { entries: readonly HelpEntry[]; initialQuery: string }) {
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const input = useRef<HTMLInputElement>(null);
  const results = filterHelp(entries, query);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery(readHelpQuery(draft)); }
  return <div className={styles.help}>
    <form action="/ayuda" method="get" onSubmit={submit} className={styles.search} role="search" aria-label="Buscar en la ayuda">
      <label htmlFor="help-query">Buscar en la ayuda</label>
      <input ref={input} id="help-query" name="q" type="search" placeholder="Exportar workflow" maxLength={120} value={draft} onChange={(event) => setDraft(event.target.value)} aria-describedby="help-search-scope"/>
      <p id="help-search-scope" className={styles.small}>Búsqueda local sobre estas guías. Sin solicitudes a servicios externos.</p>
      <div className={styles.searchActions}><Button type="submit" variant="secondary">Buscar</Button>{query ? <PublicNavLink href="/ayuda" onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); setDraft(""); setQuery(""); input.current?.focus();
      }}>Mostrar todas</PublicNavLink> : null}</div>
    </form>
    <p role="status" aria-live="polite" aria-atomic="true" className={styles.small}>{results.length} {results.length === 1 ? "guía encontrada" : "guías encontradas"}{query ? ` para «${query}»` : ""}.</p>
    <div className={styles.helpResults}>{results.length ? results.map((entry) => <article key={entry.id} className={styles.helpCard}><h2 className={styles.cardTitle}>{entry.question}</h2><p className={styles.muted}>{entry.answer}</p></article>) : <p>No encontramos guías con esos términos. Prueba otra búsqueda o muestra todas las guías.</p>}</div>
  </div>;
}
