"""API HTTP inicial para auditorías estáticas de workflows n8n.

Esta API es deliberadamente sin sesiones ni persistencia. No publicarla
sin autenticación en la capa de entrada y controles de abuso.
"""
from __future__ import annotations

import json
import math
from dataclasses import asdict
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from packages.qa_engine import (
    N8nAuditOrchestrator,
    N8nWorkflowParser,
    Severity,
    WorkflowMetrics,
)

MAX_REQUEST_BYTES = 1_048_576  # 1 MiB; límite de lectura por streaming
MAX_NODES = 150
MAX_EDGES = 2_000
MAX_DEPTH = 32
MAX_JSON_ITEMS = 30_000

# Documentación interactiva deshabilitada hasta integrar autenticación.
app = FastAPI(
    title="n8n QA API",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness HTTP: no necesita BD, Redis ni autenticación."""
    return {"status": "ok", "service": "n8n-qa-api", "version": "0.1.0"}


def _invalid(message: str) -> None:
    raise HTTPException(status_code=422, detail=message)


def _validate_workflow(workflow: Any) -> dict[str, Any]:
    """Rechazar datos inválidos antes de ejecutar el motor heredado."""
    if not isinstance(workflow, dict):
        _invalid("workflow debe ser un objeto JSON.")

    # Escaneo iterativo: evita recursiones excesivas en el motor heredado.
    stack: list[tuple[Any, int]] = [(workflow, 0)]
    count = 0
    while stack:
        value, depth = stack.pop()
        count += 1
        if count > MAX_JSON_ITEMS:
            _invalid("El JSON contiene demasiados elementos.")
        if depth > MAX_DEPTH:
            _invalid("El JSON supera el nivel máximo de anidamiento.")
        if isinstance(value, dict):
            stack.extend((v, depth + 1) for v in value.values())
        elif isinstance(value, list):
            stack.extend((v, depth + 1) for v in value)

    nodes = workflow.get("nodes")
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= MAX_NODES:
        _invalid(f"nodes debe contener entre 1 y {MAX_NODES} nodos.")

    name = workflow.get("name", "Flujo sin nombre")
    if not isinstance(name, str) or len(name) > 200:
        _invalid("name debe ser un texto de hasta 200 caracteres.")

    settings = workflow.get("settings", {})
    if not isinstance(settings, dict):
        _invalid("settings debe ser un objeto JSON.")

    known_names: set[str] = set()
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            _invalid(f"nodes[{index}] debe ser un objeto.")
        for field in ("name", "type"):
            val = node.get(field)
            if not isinstance(val, str) or not val.strip() or len(val) > 200:
                _invalid(f"nodes[{index}].{field} es obligatorio (máximo 200 caracteres).")
        if node["name"] in known_names:
            _invalid("Los nombres de los nodos deben ser únicos.")
        known_names.add(node["name"])
        if not isinstance(node.get("parameters", {}), dict):
            _invalid(f"nodes[{index}].parameters debe ser un objeto.")
        if not isinstance(node.get("credentials", {}), dict):
            _invalid(f"nodes[{index}].credentials debe ser un objeto.")
        pos = node.get("position", [0, 0])
        if (not isinstance(pos, list) or len(pos) != 2 or
            any(isinstance(v, bool) or not isinstance(v, (int, float)) or
                abs(v) > 1e9 or not math.isfinite(v) for v in pos)):
            _invalid(f"nodes[{index}].position debe tener dos números finitos.")

    connections = workflow.get("connections", {})
    if not isinstance(connections, dict):
        _invalid("connections debe ser un objeto JSON.")

    edges = 0
    for source, ports in connections.items():
        if source not in known_names or not isinstance(ports, dict):
            _invalid("connections contiene un nodo origen desconocido o puertos inválidos.")
        for port, branches in ports.items():
            if not isinstance(port, str) or not isinstance(branches, list):
                _invalid("connections contiene un puerto inválido.")
            for branch_edges in branches:
                if not isinstance(branch_edges, list):
                    _invalid("connections contiene una rama inválida.")
                edges += len(branch_edges)
                if edges > MAX_EDGES:
                    _invalid(f"El workflow supera {MAX_EDGES} conexiones.")
                for edge in branch_edges:
                    if (not isinstance(edge, dict) or not isinstance(edge.get("node"), str) or
                        edge["node"] not in known_names):
                        _invalid("connections contiene una conexión con destino inválido.")

    return workflow


async def _read_json(request: Request) -> Any:
    content_type = request.headers.get("content-type", "").split(";", 1)[0].lower().strip()
    if content_type != "application/json":
        raise HTTPException(status_code=415, detail="Content-Type debe ser application/json.")
    try:
        length = int(request.headers.get("content-length", "0"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Content-Length inválido.")
    if length > MAX_REQUEST_BYTES:
        raise HTTPException(status_code=413, detail="El JSON excede 1 MiB.")

    payload = bytearray()
    async for chunk in request.stream():
        if len(payload) + len(chunk) > MAX_REQUEST_BYTES:
            raise HTTPException(status_code=413, detail="El JSON excede 1 MiB.")
        payload.extend(chunk)
    try:
        return json.loads(payload)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="El cuerpo no es JSON válido.")


def _audit_workflow(workflow: dict[str, Any]) -> dict[str, Any]:
    parser = N8nWorkflowParser(workflow)
    findings = N8nAuditOrchestrator(parser).run_all_engines()
    metrics = WorkflowMetrics(
        workflow_name=parser.workflow_name,
        total_nodes=sum(not parser.is_sticky_note(node) for node in parser.nodes),
        total_connections=parser.total_connections_count,
        critical_count=sum(f.severity == Severity.CRITICAL for f in findings),
        warning_count=sum(f.severity == Severity.WARNING for f in findings),
        pass_count=sum(f.severity == Severity.PASS for f in findings),
    )
    return {
        "engine_version": "static-v1",
        "metrics": asdict(metrics),
        "findings": [asdict(f) for f in findings],
    }


@app.post("/api/v1/audits", tags=["audits"])
async def create_audit(request: Request) -> JSONResponse:
    """Auditoría síncrona temporal. No ejecuta nodos ni almacena el JSON."""
    data = await _read_json(request)
    if not isinstance(data, dict) or set(data) != {"workflow"}:
        _invalid('El cuerpo debe contener únicamente el campo "workflow".')
    workflow = _validate_workflow(data["workflow"])
    try:
        result = await run_in_threadpool(_audit_workflow, workflow)
    except Exception:
        # No reflejar errores internos: podrían incluir datos del workflow.
        raise HTTPException(status_code=500, detail="Error interno de auditoría.")
    return JSONResponse(
        result,
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )
