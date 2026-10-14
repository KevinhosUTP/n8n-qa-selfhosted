"""Interfaz Streamlit heredada para el motor n8n QA.

Ejecutar con: streamlit run app.py
"""

import json
import re
from typing import List

import streamlit as st

from packages.qa_engine import (
    AuditFinding,
    EngineCategory,
    N8nAuditOrchestrator,
    N8nWorkflowParser,
    Severity,
    WorkflowAutoRemediator,
    WorkflowMetrics,
)

# =====================================================================
# 5. INTERFAZ GRÁFICA (STREAMLIT FRONTEND)
# =====================================================================

def render_findings_section(findings: List[AuditFinding], engine: EngineCategory) -> None:
    """Renderiza los hallazgos de un motor específico usando íconos y colores."""
    engine_findings = [f for f in findings if f.engine == engine]

    if not engine_findings:
        st.success("✅ Sin observaciones en este motor.")
        return

    for item in engine_findings:
        if item.severity == Severity.CRITICAL:
            icon = "🔴"
            container = st.error
        elif item.severity == Severity.WARNING:
            icon = "🟡"
            container = st.warning
        else:
            icon = "🟢"
            container = st.success

        with st.expander(f"{icon} [{item.severity.value}] {item.rule_name} — Nodo: `{item.node_name}`",
                         expanded=(item.severity != Severity.PASS)):
            container(f"**Diagnóstico:** {item.message}")
            st.markdown(f"**🛠️ Recomendación Arquitectónica:** {item.recommendation}")
            st.caption(f"Tipo de Nodo Técnico: `{item.node_type}`")


def main() -> None:
    st.set_page_config(
        page_title="n8n QA & DevSecOps Dashboard v2.15.0",
        page_icon="🛡️",
        layout="wide"
    )

    # 1. Header y Uploader
    st.title("🛡️ Dashboard de QA, Ciberseguridad y Arquitectura para n8n")
    st.markdown(
        "**Entorno Objetivo:** `n8n Self-Hosted v2.15.0` | **Motores Activos:** "
        "DevSecOps, Escalabilidad, Integridad de Datos y Prompt Engineering (LangChain/AI)."
    )
    st.divider()

    uploaded_file = st.file_uploader(
        "📂 Sube el archivo de flujo de trabajo de n8n (.json) para iniciar la auditoría automática",
        type=["json"],
        help="Exporta tu workflow desde n8n en formato JSON y súbelo aquí."
    )

    if uploaded_file is None:
        st.info(
            "👆 Sube un archivo `.json` de n8n para visualizar las métricas, la auditoría de los 4 motores y generar el JSON refactorizado.")
        return

    # Manejo robusto de errores durante la carga y validación del esquema JSON
    try:
        raw_content = uploaded_file.read().decode("utf-8")
        workflow_json = json.loads(raw_content)

        if not isinstance(workflow_json, dict) or "nodes" not in workflow_json or not isinstance(workflow_json["nodes"],
                                                                                                 list):
            st.error(
                "❌ El archivo JSON subido no cumple con el esquema estructural de n8n (falta la clave obligatoria `nodes` como lista).")
            return

    except json.JSONDecodeError as e:
        st.error(f"❌ Error de sintaxis en el archivo JSON: `{str(e)}`")
        return
    except Exception as e:
        st.error(f"❌ Error inesperado al leer el archivo: `{str(e)}`")
        return

    # Ejecución del Parser y los 4 Motores de Auditoría
    try:
        parser = N8nWorkflowParser(workflow_json)
        orchestrator = N8nAuditOrchestrator(parser)
        findings = orchestrator.run_all_engines()

        critical_total = sum(1 for f in findings if f.severity == Severity.CRITICAL)
        warning_total = sum(1 for f in findings if f.severity == Severity.WARNING)
        pass_total = sum(1 for f in findings if f.severity == Severity.PASS)

        executable_nodes_count = sum(1 for n in parser.nodes if not parser.is_sticky_note(n))

        metrics = WorkflowMetrics(
            workflow_name=parser.workflow_name,
            total_nodes=executable_nodes_count,
            total_connections=parser.total_connections_count,
            critical_count=critical_total,
            warning_count=warning_total,
            pass_count=pass_total
        )
    except Exception as e:
        st.error(f"❌ Error interno durante el análisis del grafo de n8n: `{str(e)}`")
        return

    # 2. Dashboard de Métricas
    st.subheader(f"📊 Resumen Ejecutivo: `{metrics.workflow_name}`")
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="Total de Nodos (Activos)",
            value=metrics.total_nodes,
            delta="Óptimo (<=20)" if metrics.total_nodes <= 20 else "Alto (>20)",
            delta_color="normal" if metrics.total_nodes <= 20 else "inverse"
        )
    with col2:
        st.metric(
            label="Total de Conexiones",
            value=metrics.total_connections
        )
    with col3:
        st.metric(
            label="🔴 Vulnerabilidades Críticas",
            value=metrics.critical_count,
            delta="Requiere acción inmediata" if metrics.critical_count > 0 else "0 Críticas",
            delta_color="inverse" if metrics.critical_count > 0 else "normal"
        )
    with col4:
        st.metric(
            label="🟡 Advertencias Arquitectónicas",
            value=metrics.warning_count,
            delta=f"{metrics.warning_count} detectadas" if metrics.warning_count > 0 else "0 Advertencias",
            delta_color="off" if metrics.warning_count > 0 else "normal"
        )

    st.divider()

    # 3. Reporte Detallado en Pestañas (st.tabs)
    st.subheader("🔍 Reporte Detallado por Motor de Auditoría")
    tab_sec, tab_arch, tab_logic, tab_ai = st.tabs([
        EngineCategory.SECURITY.value,
        EngineCategory.ARCHITECTURE.value,
        EngineCategory.DATA_LOGIC.value,
        EngineCategory.PROMPT_ENG.value
    ])

    with tab_sec:
        render_findings_section(findings, EngineCategory.SECURITY)

    with tab_arch:
        render_findings_section(findings, EngineCategory.ARCHITECTURE)

    with tab_logic:
        render_findings_section(findings, EngineCategory.DATA_LOGIC)

    with tab_ai:
        render_findings_section(findings, EngineCategory.PROMPT_ENG)

    st.divider()

    # 4. Auto-Remediación (Generador y Descarga de JSON Refactorizado)
    st.subheader("🛠️ Auto-Remediación y Etiquetado Visual (v1.0)")
    st.markdown(
        "Genera una versión intervenida del archivo `.json` lista para importarse en **n8n v2.15.0**. "
        "El motor inyecta automáticamente nodos `Sticky Note` con el diagnóstico encima de cada nodo vulnerable, "
        "activa las etiquetas en lienzo (`notesInFlow`) y cambia la propiedad `color` de los nodos críticos a rojo (`#FF2B2B`)."
    )

    refactored_json_str = WorkflowAutoRemediator.generate_refactored_json(
        raw_json=workflow_json,
        findings=findings,
        metrics=metrics
    )

    safe_filename = re.sub(r"[^a-zA-Z0-9_\-]", "_", metrics.workflow_name)
    st.download_button(
        label="⬇️ Descargar JSON Refactorizado con Etiquetas QA",
        data=refactored_json_str.encode("utf-8"),
        file_name=f"{safe_filename}_qa_refactored.json",
        mime="application/json",
        type="primary",
        use_container_width=True
    )


if __name__ == "__main__":
    main()