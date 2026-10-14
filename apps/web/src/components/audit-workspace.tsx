"use client";

import { useMemo, useState } from "react";
import type { AuditFinding, AuditResult, AuditSeverity } from "@/lib/types";
import { isAuditResult } from "@/lib/types";

const MAX_BYTES = 1_048_576;
const filters: Array<"TODOS" | AuditSeverity> = ["TODOS", "CRÍTICO", "ADVERTENCIA", "OK"];

function severityClass(s: AuditSeverity): string {
  return s === "CRÍTICO" ? "critical" : s === "ADVERTENCIA" ? "warning" : "success";
}

export function AuditWorkspace() {
  const [fileName, setFileName] = useState("");
  const [workflow, setWorkflow] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [filter, setFilter] = useState<"TODOS" | AuditSeverity>("TODOS");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadFile(file?: File) {
    setError(""); setResult(null); setWorkflow(null); setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) { setError("Selecciona un archivo .json."); return; }
    if (file.size > MAX_BYTES) { setError("El JSON no debe superar 1 MiB."); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("El archivo debe contener un objeto JSON.");
      }
      const candidate = parsed as Record<string, unknown>;
      if (!Array.isArray(candidate.nodes) || !candidate.nodes.length) {
        throw new Error("El workflow debe contener una lista nodes con al menos un nodo.");
      }
      setWorkflow(candidate);
      setFileName(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "El archivo no es válido.");
    }
  }

  async function runAudit() {
    if (!workflow || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const detail = data && typeof data === "object" && "detail" in data
          ? String((data as { detail?: unknown }).detail)
          : "La auditoría no pudo completarse.";
        throw new Error(detail);
      }
      if (!isAuditResult(data)) throw new Error("El servidor devolvió una respuesta inesperada.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al consultar la API.");
    } finally {
      setBusy(false);
    }
  }

  const findings = useMemo(() => result?.findings.filter(f => filter === "TODOS" || f.severity === filter) ?? [], [result, filter]);
  const grouped = useMemo(() => findings.reduce<Record<string, AuditFinding[]>>((acc, finding) => {
    (acc[finding.engine] ??= []).push(finding);
    return acc;
  }, {}), [findings]);

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Navegación">
        <div className="brand"><span className="brandMark">∴</span><div><strong>n8n QA</strong><small>Workflow Intelligence</small></div></div>
        <div className="navLabel">WORKSPACE</div>
        <div className="activeNav">▦ <span>Auditoría de workflows</span></div>
        <div className="navMuted">⌘ <span>Proyectos <em>Próximamente</em></span></div>
        <div className="navMuted">◎ <span>Historial <em>Próximamente</em></span></div>
        <div className="sidebarFoot"><span className="liveDot" /> Development <small>v0.1 · Vista previa</small></div>
      </aside>
      <main className="main">
        <header className="topbar"><span>Workspace <span className="breadcrumb">/ Auditoría</span></span><span className="environment">DEVELOPMENT</span></header>
        <div className="mainInner">
          <div className="eyebrow">PLATAFORMA DE ANÁLISIS ESTÁTICO</div>
          <h1>Audita tus <span>workflows.</span><br />Antes de llevarlos a producción.</h1>
          <p className="intro">Detecta posibles fallos de seguridad, escalabilidad, lógica de datos y configuración de agentes de IA en archivos JSON exportados de n8n.</p>
          <section className="panel uploadPanel" aria-labelledby="upload-title">
            <div className="sectionHead"><div><span className="step">01 / IMPORTAR</span><h2 id="upload-title">Selecciona un workflow</h2></div><span className="format">JSON · máximo 1 MiB</span></div>
            <label className="dropzone">
              <span className="uploadIcon" aria-hidden="true">⇧</span>
              <strong>{fileName || "Importar un archivo JSON de n8n"}</strong>
              <span>{fileName ? "Archivo listo para analizar" : "Selecciona un archivo desde tu equipo"}</span>
              <input type="file" accept=".json,application/json" onChange={(event) => void loadFile(event.currentTarget.files?.[0])} aria-label="Importar workflow JSON" />
            </label>
            <div className="actionLine">
              <span className="privacyNote">◇ Usa workflows ficticios. No cargues credenciales reales.</span>
              <button type="button" className="primaryButton" disabled={!workflow || busy} onClick={() => void runAudit()}>{busy ? "Analizando…" : "Ejecutar auditoría →"}</button>
            </div>
            {error && <div className="error" role="alert">{error}</div>}
          </section>
          <section aria-labelledby="results-title" className="results">
            <div className="sectionHead resultHead"><div><span className="step">02 / RESULTADOS</span><h2 id="results-title">Informe de auditoría</h2></div>{result && <span className="engineVersion">{result.engine_version}</span>}</div>
            {result ? <>
              <div className="metricGrid">
                <Metric label="Nodos activos" value={result.metrics.total_nodes} />
                <Metric label="Conexiones" value={result.metrics.total_connections} />
                <Metric label="Críticos" value={result.metrics.critical_count} tone="critical" />
                <Metric label="Advertencias" value={result.metrics.warning_count} tone="warning" />
                <Metric label="Verificaciones OK" value={result.metrics.pass_count} tone="success" />
              </div>
              <div className="resultsBar"><div><strong>{result.metrics.workflow_name}</strong><small>{result.findings.length} hallazgos · auditoría heurística</small></div><div className="filters" aria-label="Filtrar severidad">{filters.map(option => <button type="button" key={option} className={filter===option ? "selected" : ""} aria-pressed={filter===option} onClick={()=>setFilter(option)}>{option === "TODOS" ? "Todos" : option === "ADVERTENCIA" ? "Advertencias" : option === "CRÍTICO" ? "Críticos" : "OK"}</button>)}</div></div>
              {Object.entries(grouped).length ? Object.entries(grouped).map(([engine, items]) => <div key={engine} className="findingGroup"><h3>{engine} <span>{items.length}</span></h3>{items.map((item,index)=><article className="finding" key={`${engine}-${item.rule_name}-${index}`}><div className="findingHeader"><span className={`pill ${severityClass(item.severity)}`}>{item.severity}</span><strong>{item.rule_name}</strong></div><p>{item.message}</p><p className="recommendation"><span>RECOMENDACIÓN</span>{item.recommendation}</p><small>Nodo: {item.node_name}</small></article>)}</div>) : <div className="emptyPanel">No hay hallazgos para este filtro.</div>}
            </> : <div className="emptyPanel"><span aria-hidden="true" className="emptyIcon">◎</span><strong>Aquí aparecerá tu informe</strong><p>Importa un workflow y ejecuta la auditoría para obtener métricas y recomendaciones.</p></div>}
          </section>
          <footer>n8n QA · Análisis estático orientativo, no una certificación de seguridad. <span>Fase 7 / MVP</span></footer>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone = "" }: {label: string; value: number; tone?: string}) {
  return <div className="metric panel"><small>{label}</small><strong className={tone}>{value}</strong></div>;
}
