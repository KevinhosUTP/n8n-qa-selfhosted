"""
Dashboard de QA, Ciberseguridad (DevSecOps) y Arquitectura para n8n (v2.15.0)
Autor: Staff Software Architect & DevSecOps Specialist
Ejecución: streamlit run app.py
"""

import copy
import json
import re
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

import streamlit as st


# =====================================================================
# 1. MODELOS DE DATOS Y TIPADO ESTÁTICO
# =====================================================================

class Severity(str, Enum):
    """Niveles de severidad estandarizados para los hallazgos de auditoría."""
    CRITICAL = "CRÍTICO"
    WARNING = "ADVERTENCIA"
    PASS = "OK"


class EngineCategory(str, Enum):
    """Categorías correspondientes a los 4 motores de auditoría."""
    SECURITY = "1. Ciberseguridad e Integraciones"
    ARCHITECTURE = "2. Arquitectura y Escalabilidad"
    DATA_LOGIC = "3. Lógica y Flujo de Datos"
    PROMPT_ENG = "4. Prompt Engineering (Agentes IA)"


@dataclass
class AuditFinding:
    """Representa un hallazgo individual generado por cualquiera de los motores."""
    engine: EngineCategory
    severity: Severity
    rule_name: str
    node_name: str
    node_type: str
    message: str
    recommendation: str


@dataclass
class WorkflowMetrics:
    """Métricas generales del flujo de trabajo de n8n."""
    workflow_name: str
    total_nodes: int
    total_connections: int
    critical_count: int
    warning_count: int
    pass_count: int


# =====================================================================
# 2. MOTOR DE PARSING DEL ESQUEMA JSON DE N8N
# =====================================================================

class N8nWorkflowParser:
    """
    Motor encargado de parsear, normalizar y construir el grafo topológico
    del flujo de trabajo de n8n (compatible con esquema v2.15.0).

    Estructura esperada del JSON de n8n:
    - "name": str (Nombre del flujo)
    - "nodes": List[Dict] -> Cada nodo contiene 'id', 'name', 'type', 'position',
      'parameters' (dict con configuración interna) y opcionalmente 'credentials'.
    - "connections": Dict[str, Dict[str, List[List[Dict[str, Any]]]]] -> Mapa de
      adyacencia indexado por el 'name' del nodo origen, seguido del tipo de puerto
      ('main', 'ai_tool', 'ai_languageModel', 'ai_memory', etc.) y un array de
      salidas (ramas) que contienen los objetos de conexión destino.
    """

    def __init__(self, raw_json: Dict[str, Any]) -> None:
        self.raw_data: Dict[str, Any] = raw_json
        self.workflow_name: str = str(raw_json.get("name", "Flujo sin nombre"))
        self.nodes: List[Dict[str, Any]] = raw_json.get("nodes", [])
        self.connections: Dict[str, Any] = raw_json.get("connections", {})

        # Índices rápidos por nombre de nodo
        self.nodes_by_name: Dict[str, Dict[str, Any]] = {
            n.get("name", f"unnamed_{i}"): n for i, n in enumerate(self.nodes)
        }

        # Grafos de adyacencia: { node_name: Set[connected_node_names] }
        self.outbound_all: Dict[str, Set[str]] = {name: set() for name in self.nodes_by_name}
        self.inbound_all: Dict[str, Set[str]] = {name: set() for name in self.nodes_by_name}

        # Salidas 'main' estructuradas por índice de rama: { node_name: List[List[str]] }
        self.main_branches: Dict[str, List[List[str]]] = {name: [] for name in self.nodes_by_name}
        self.total_connections_count: int = 0

        self._build_topology_graph()

    def _build_topology_graph(self) -> None:
        """
        Recorre el objeto 'connections' de n8n para poblar las relaciones de entrada/salida
        tanto para flujos de datos ('main') como para conexiones de sub-nodos IA ('ai_*').
        """
        if not isinstance(self.connections, dict):
            return

        for source_node, port_map in self.connections.items():
            if not isinstance(port_map, dict):
                continue

            for port_type, branches in port_map.items():
                if not isinstance(branches, list):
                    continue

                if port_type == "main" and source_node in self.main_branches:
                    self.main_branches[source_node] = []

                for branch in branches:
                    branch_targets: List[str] = []
                    if isinstance(branch, list):
                        for edge in branch:
                            if isinstance(edge, dict) and "node" in edge:
                                target_node = str(edge["node"])
                                branch_targets.append(target_node)
                                self.total_connections_count += 1

                                # Registrar en grafos generales
                                self.outbound_all.setdefault(source_node, set()).add(target_node)
                                self.inbound_all.setdefault(target_node, set()).add(source_node)

                    if port_type == "main" and source_node in self.main_branches:
                        self.main_branches[source_node].append(branch_targets)

    @staticmethod
    def is_trigger_node(node: Dict[str, Any]) -> bool:
        """Determina si un nodo actúa como disparador (Trigger) o Webhook en n8n."""
        node_type = str(node.get("type", "")).lower()
        trigger_keywords = ("trigger", "webhook", "schedule", "cron", "start", "manual")
        return any(kw in node_type for kw in trigger_keywords) or "webhookId" in node

    @staticmethod
    def is_sticky_note(node: Dict[str, Any]) -> bool:
        """Ignora notas adhesivas visuales del análisis lógico."""
        return str(node.get("type", "")) == "n8n-nodes-base.stickyNote"

    def get_downstream_nodes(self, start_node: str, max_depth: int = 2) -> Set[str]:
        """Obtiene los nodos sucesores hasta una profundidad dada (BFS)."""
        visited: Set[str] = set()
        queue: List[Tuple[str, int]] = [(start_node, 0)]

        while queue:
            current, depth = queue.pop(0)
            if depth >= max_depth:
                continue
            for neighbor in self.outbound_all.get(current, set()):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))
        return visited


# =====================================================================
# 3. MOTORES DE AUDITORÍA (BACKEND)
# =====================================================================

class N8nAuditOrchestrator:
    """Ejecuta los 4 motores de auditoría sobre el flujo parseado."""

    # Patrones RegEx para detección de secretos hardcodeados (DevSecOps)
    SECRET_PATTERNS: List[Tuple[str, re.Pattern]] = [
        ("Bearer / JWT Token", re.compile(r"Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*", re.IGNORECASE)),
        ("OpenAI / Anthropic API Key", re.compile(r"\bsk-(?:proj-|ant-)?[A-Za-z0-9\-_]{20,}\b")),
        ("Google API Key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
        ("AWS Access Key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
        ("Slack / GitHub Token", re.compile(r"\b(?:xox[baprs]-[0-9a-zA-Z\-]{10,}|gh[pousr]_[A-Za-z0-9_]{30,})\b")),
        ("URL con Token/API Key en Query", re.compile(
            r"https?://[^\s\"']+[?&](?:api_key|apikey|token|access_token|secret|password|key)=([A-Za-z0-9\-_\.]{8,})",
            re.IGNORECASE)),
        ("Asignación explícita de Secreto", re.compile(
            r"(?:api[_-]?key|secret[_-]?key|password|passwd|private[_-]?key|access[_-]?token)\s*[:=]\s*['\"](?!\{\{)[A-Za-z0-9\-_@#\$%\^&\*\!]{8,}['\"]",
            re.IGNORECASE)),
    ]

    # Claves sensibles dentro de headers o query params
    SENSITIVE_PARAM_KEYS: Set[str] = {
        "authorization", "x-api-key", "api-key", "apikey", "password",
        "secret", "token", "access_token", "client_secret", "private_key"
    }

    def __init__(self, parser: N8nWorkflowParser) -> None:
        self.parser = parser
        self.findings: List[AuditFinding] = []

    def run_all_engines(self) -> List[AuditFinding]:
        """Ejecuta secuencialmente los 4 motores de auditoría."""
        self.findings.clear()
        self._run_cybersecurity_engine()
        self._run_architecture_engine()
        self._run_data_logic_engine()
        self._run_prompt_engineering_engine()
        return self.findings

    # -----------------------------------------------------------------
    # MOTOR 1: CIBERSEGURIDAD E INTEGRACIONES
    # -----------------------------------------------------------------
    def _run_cybersecurity_engine(self) -> None:
        critical_found = False

        for node in self.parser.nodes:
            if self.parser.is_sticky_note(node):
                continue

            node_name = str(node.get("name", "Desconocido"))
            node_type = str(node.get("type", "Desconocido"))
            params = node.get("parameters", {})
            credentials = node.get("credentials", {})

            # 1. Escaneo profundo de parámetros buscando secretos en texto plano
            exposed_secrets = self._scan_dict_for_secrets(params)
            for secret_type, location_hint in exposed_secrets:
                critical_found = True
                self.findings.append(AuditFinding(
                    engine=EngineCategory.SECURITY,
                    severity=Severity.CRITICAL,
                    rule_name="Credenciales Hardcodeadas en Parámetros",
                    node_name=node_name,
                    node_type=node_type,
                    message=f"Se detectó un secreto en texto plano ({secret_type}) en `{location_hint}`.",
                    recommendation="Elimine el valor en texto plano y utilice el almacén nativo `credentials` de n8n o variables de entorno seguras."
                ))

            # 2. Validación específica de nodos HTTP Request sin 'credentials' nativas
            if "httprequest" in node_type.lower():
                auth_mode = str(params.get("authentication", "none")).lower()
                has_native_creds = bool(credentials) and auth_mode != "none"

                # Si envía headers manuales pero no usa credentials nativas
                send_headers = params.get("sendHeaders", False)
                if not has_native_creds and send_headers:
                    critical_found = True
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.SECURITY,
                        severity=Severity.CRITICAL,
                        rule_name="Uso de Cabeceras Manuales sin Propiedad Credentials",
                        node_name=node_name,
                        node_type=node_type,
                        message="El nodo HTTP Request envía cabeceras personalizadas con `authentication: none` y carece del bloque nativo `credentials`.",
                        recommendation="Configure `authentication: predefinedCredentialType` o `genericCredentialType` vinculando la propiedad nativa `credentials` de n8n."
                    ))

        if not critical_found:
            self.findings.append(AuditFinding(
                engine=EngineCategory.SECURITY,
                severity=Severity.PASS,
                rule_name="Higiene de Credenciales y Secretos",
                node_name="Global",
                node_type="Workflow",
                message="No se detectaron API Keys, Bearer tokens ni contraseñas hardcodeadas en los parámetros de los nodos.",
                recommendation="Mantener el uso estricto del baúl de credenciales cifradas de n8n."
            ))

    def _scan_dict_for_secrets(self, data: Any, path: str = "parameters") -> List[Tuple[str, str]]:
        """Recorre recursivamente los parámetros de un nodo buscando credenciales en texto plano."""
        detected: List[Tuple[str, str]] = []

        if isinstance(data, dict):
            # Detectar pares { "name": "Authorization", "value": "..." } típicos de HTTP Request
            param_name = str(data.get("name", "")).strip().lower()
            param_val = str(data.get("value", "")).strip()
            if param_name in self.SENSITIVE_PARAM_KEYS and param_val:
                if not param_val.startswith("={{"):
                    detected.append(
                        (f"Cabecera/Parámetro sensible '{param_name}' en texto plano", f"{path}.{param_name}"))

            for k, v in data.items():
                key_lower = str(k).lower()
                current_path = f"{path}.{k}"
                if key_lower in self.SENSITIVE_PARAM_KEYS and isinstance(v, str) and v.strip():
                    if not v.strip().startswith("={{"):
                        detected.append((f"Propiedad sensible '{k}' hardcodeada", current_path))
                detected.extend(self._scan_dict_for_secrets(v, current_path))

        elif isinstance(data, list):
            for idx, item in enumerate(data):
                detected.extend(self._scan_dict_for_secrets(item, f"{path}[{idx}]"))

        elif isinstance(data, str) and data.strip():
            for label, pattern in self.SECRET_PATTERNS:
                if pattern.search(data):
                    detected.append((label, path))

        return detected

    # -----------------------------------------------------------------
    # MOTOR 2: ARQUITECTURA Y ESCALABILIDAD
    # -----------------------------------------------------------------
    def _run_architecture_engine(self) -> None:
        executable_nodes = [n for n in self.parser.nodes if not self.parser.is_sticky_note(n)]
        node_count = len(executable_nodes)

        # 1. Regla de Modularidad (> 20 nodos)
        if node_count > 20:
            self.findings.append(AuditFinding(
                engine=EngineCategory.ARCHITECTURE,
                severity=Severity.WARNING,
                rule_name="Regla de Modularidad (Complejidad Monolítica)",
                node_name="Global",
                node_type="Workflow",
                message=f"El flujo contiene {node_count} nodos activos (supera el umbral recomendado de 20 nodos).",
                recommendation="Divida la lógica en sub-workflows especializados invocándolos mediante el nodo `Execute Workflow` (`n8n-nodes-base.executeWorkflow`) para mejorar mantenibilidad y huella de memoria en n8n 2.15.0."
            ))
        else:
            self.findings.append(AuditFinding(
                engine=EngineCategory.ARCHITECTURE,
                severity=Severity.PASS,
                rule_name="Regla de Modularidad",
                node_name="Global",
                node_type="Workflow",
                message=f"Tamaño de flujo óptimo ({node_count} nodos <= 20).",
                recommendation="El flujo mantiene una cohesión manejable."
            ))

        # 2. Regla de Resiliencia (Existencia de Error Trigger)
        has_error_trigger = any(
            "errortrigger" in str(n.get("type", "")).lower() for n in executable_nodes
        )
        has_error_workflow_setting = bool(
            self.parser.raw_data.get("settings", {}).get("errorWorkflow")
        )

        if not has_error_trigger and not has_error_workflow_setting:
            self.findings.append(AuditFinding(
                engine=EngineCategory.ARCHITECTURE,
                severity=Severity.WARNING,
                rule_name="Regla de Resiliencia (Sin Manejador Global de Errores)",
                node_name="Global",
                node_type="n8n-nodes-base.errorTrigger",
                message="No se detectó un nodo `Error Trigger` ni una configuración de `errorWorkflow` global.",
                recommendation="Incorpore un nodo `Error Trigger` o asigne un flujo de captura de fallos en Settings para instrumentar alertas y reintentos ante caídas en producción."
            ))
        else:
            self.findings.append(AuditFinding(
                engine=EngineCategory.ARCHITECTURE,
                severity=Severity.PASS,
                rule_name="Regla de Resiliencia",
                node_name="Global",
                node_type="Error Handling",
                message="Se identificó configuración de manejo de errores a nivel de arquitectura.",
                recommendation="Mantener monitoreo activo de fallos."
            ))

        # 3. Regla de Eficiencia (Detección de Schedule / Polling vs Webhooks)
        polling_nodes = [
            n for n in executable_nodes
            if any(k in str(n.get("type", "")).lower() for k in ("scheduletrigger", "cron", "interval", "poll"))
        ]
        if polling_nodes:
            for p_node in polling_nodes:
                self.findings.append(AuditFinding(
                    engine=EngineCategory.ARCHITECTURE,
                    severity=Severity.WARNING,
                    rule_name="Regla de Eficiencia (Uso de Polling / Schedule)",
                    node_name=str(p_node.get("name", "Schedule")),
                    node_type=str(p_node.get("type", "")),
                    message="El flujo utiliza ejecución periódica por consulta (Polling/Schedule), lo que consume workers innecesariamente si no hay eventos nuevos.",
                    recommendation="Evalúe migrar a una arquitectura orientada a eventos usando el nodo `Webhook` o un Trigger nativo basado en eventos si el sistema de origen lo soporta."
                ))
        else:
            self.findings.append(AuditFinding(
                engine=EngineCategory.ARCHITECTURE,
                severity=Severity.PASS,
                rule_name="Regla de Eficiencia (Event-Driven)",
                node_name="Global",
                node_type="Triggers",
                message="No se detectaron disparadores basados en Polling/Schedule ineficientes.",
                recommendation="Arquitectura reactiva basada en eventos verificada."
            ))

    # -----------------------------------------------------------------
    # MOTOR 3: LÓGICA Y FLUJO DE DATOS
    # -----------------------------------------------------------------
    def _run_data_logic_engine(self) -> None:
        executable_nodes = [n for n in self.parser.nodes if not self.parser.is_sticky_note(n)]
        issues_found = 0

        # Tipos de nodos propensos a retornar grandes volúmenes de registros (Arrays masivos)
        bulk_data_types = (
            "postgres", "mysql", "mongodb", "supabase", "mssql", "mariadb",
            "googlesheets", "airtable", "httprequest", "graphql", "s3"
        )
        batch_control_types = ("splitinbatches", "itemlists", "limit", "summarize")

        for node in executable_nodes:
            node_name = str(node.get("name", "Desconocido"))
            node_type = str(node.get("type", "Desconocido"))
            node_type_lower = node_type.lower()
            params = node.get("parameters", {})

            # 1. Regla de Cuellos de Botella (Riesgo de OOM)
            is_bulk_candidate = any(bt in node_type_lower for bt in bulk_data_types)
            # Evitar falsos positivos si es una escritura puntual o si ya tiene límite explícito pequeño
            operation = str(params.get("operation", "getAll")).lower()
            return_all = params.get("returnAll", False)

            if is_bulk_candidate and (return_all is True or operation in ("getall", "select", "executequery",
                                                                          "read") or "httprequest" in node_type_lower):
                downstream_names = self.parser.get_downstream_nodes(node_name, max_depth=2)
                has_batching = any(
                    any(b_type in str(self.parser.nodes_by_name.get(dn, {}).get("type", "")).lower() for b_type in
                        batch_control_types)
                    for dn in downstream_names
                )
                if not has_batching:
                    issues_found += 1
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.DATA_LOGIC,
                        severity=Severity.WARNING,
                        rule_name="Regla de Cuellos de Botella (Riesgo OOM)",
                        node_name=node_name,
                        node_type=node_type,
                        message="Este nodo puede recuperar o recibir colecciones masivas de datos y no está seguido por un nodo `Loop Over Items (Split in Batches)`.",
                        recommendation="Inserte un nodo `Loop Over Items (Split in Batches)` inmediatamente después o active paginación/límites estrictos para evitar desbordamiento de memoria (OOM) en el contenedor de n8n."
                    ))

            # 2. Regla de Integridad: Nodos Huérfanos
            in_edges = self.parser.inbound_all.get(node_name, set())
            out_edges = self.parser.outbound_all.get(node_name, set())
            is_trigger = self.parser.is_trigger_node(node)

            if not is_trigger and len(in_edges) == 0 and len(out_edges) == 0:
                issues_found += 1
                self.findings.append(AuditFinding(
                    engine=EngineCategory.DATA_LOGIC,
                    severity=Severity.WARNING,
                    rule_name="Regla de Integridad (Nodo Huérfano)",
                    node_name=node_name,
                    node_type=node_type,
                    message="El nodo se encuentra completamente desconectado (sin entradas ni salidas) y no es un Trigger.",
                    recommendation="Conéctelo al flujo principal o elimínelo para mantener limpio el grafo de ejecución."
                ))
            elif is_trigger and len(out_edges) == 0:
                issues_found += 1
                self.findings.append(AuditFinding(
                    engine=EngineCategory.DATA_LOGIC,
                    severity=Severity.WARNING,
                    rule_name="Regla de Integridad (Trigger Sin Salida)",
                    node_name=node_name,
                    node_type=node_type,
                    message="El nodo Trigger no tiene ningún nodo conectado a su salida.",
                    recommendation="Conecte la salida del disparador o elimínelo si está en desuso."
                ))

            # 3. Regla de Integridad: Rutas Muertas en Nodos Lógicos (If / Switch)
            if node_type_lower.endswith(".if"):
                branches = self.parser.main_branches.get(node_name, [])
                true_connected = len(branches) > 0 and len(branches[0]) > 0
                false_connected = len(branches) > 1 and len(branches[1]) > 0

                if not (true_connected and false_connected):
                    missing_branch = "True y False" if not true_connected and not false_connected else (
                        "True (Salida 0)" if not true_connected else "False (Salida 1)")
                    issues_found += 1
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.DATA_LOGIC,
                        severity=Severity.WARNING,
                        rule_name="Regla de Integridad (Ruta Muerta en Nodo If)",
                        node_name=node_name,
                        node_type=node_type,
                        message=f"La rama `{missing_branch}` del nodo condicional `If` no está conectada a ningún nodo destino.",
                        recommendation="Maneje explícitamente ambas salidas (True/False) o agregue un nodo de cierre/registro para evitar silencios operativos."
                    ))

            elif node_type_lower.endswith(".switch"):
                rules_values = params.get("rules", {}).get("values", [])
                has_fallback = params.get("options", {}).get("fallbackOutput", "none") != "none"
                expected_outputs = len(rules_values) + (1 if has_fallback else 0)
                branches = self.parser.main_branches.get(node_name, [])

                empty_outputs = [
                    idx for idx in range(max(expected_outputs, len(branches)))
                    if idx >= len(branches) or len(branches[idx]) == 0
                ]
                if empty_outputs:
                    issues_found += 1
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.DATA_LOGIC,
                        severity=Severity.WARNING,
                        rule_name="Regla de Integridad (Ruta Muerta en Nodo Switch)",
                        node_name=node_name,
                        node_type=node_type,
                        message=f"El nodo `Switch` tiene salidas configuradas sin conexión en los índices de salida: {empty_outputs}.",
                        recommendation="Verifique que todas las reglas del `Switch` y su salida `Fallback` tengan un flujo de destino conectado."
                    ))

        if issues_found == 0:
            self.findings.append(AuditFinding(
                engine=EngineCategory.DATA_LOGIC,
                severity=Severity.PASS,
                rule_name="Integridad de Grafo y Control de Lotes",
                node_name="Global",
                node_type="Workflow",
                message="Flujo íntegro: sin nodos huérfanos, sin rutas muertas ni cuellos de botella evidentes.",
                recommendation="Continuar aplicando buenas prácticas de paginación y control de flujo."
            ))

    # -----------------------------------------------------------------
    # MOTOR 4: PROMPT ENGINEERING (AGENTES IA EN N8N)
    # -----------------------------------------------------------------
    def _run_prompt_engineering_engine(self) -> None:
        """
        Identifica nodos de IA tanto bajo el prefijo '@n8n/n8n-nodes-base.ai*'
        como '@n8n/n8n-nodes-langchain.*' (estándar en n8n 2.15.0).
        """
        ai_nodes = [
            n for n in self.parser.nodes
            if any(prefix in str(n.get("type", "")).lower() for prefix in
                   ("@n8n/n8n-nodes-base.ai", "@n8n/n8n-nodes-langchain."))
        ]

        if not ai_nodes:
            self.findings.append(AuditFinding(
                engine=EngineCategory.PROMPT_ENG,
                severity=Severity.PASS,
                rule_name="Detección de Ecosistema IA",
                node_name="Global",
                node_type="N/A",
                message="El flujo analizado no contiene nodos de Agentes IA, Chains ni Tools.",
                recommendation="Si incorpora agentes en el futuro, asegure prompts estructurados y descripciones explícitas en cada Tool."
            ))
            return

        for node in ai_nodes:
            node_name = str(node.get("name", "Nodo IA"))
            node_type = str(node.get("type", ""))
            node_type_lower = node_type.lower()
            params = node.get("parameters", {})
            options = params.get("options", {}) if isinstance(params.get("options"), dict) else {}

            # A. Evaluación de Agentes, Chains y nodos generativos con Prompt
            is_agent_or_chain = any(
                k in node_type_lower for k in ("agent", "chain", "openai", "anthropic", "llm")
            ) and not any(sub in node_type_lower for sub in ("lmchat", "memory", "embeddings"))

            if is_agent_or_chain:
                prompt_text = str(params.get("text", params.get("prompt", ""))).strip()
                system_msg = str(options.get("systemMessage", params.get("systemMessage", ""))).strip()
                combined_context = f"{system_msg}\n{prompt_text}".strip()

                # Si es un nodo de transcripción de audio puro, no requiere prompt largo
                if params.get("resource") == "audio" and params.get("operation") == "transcribe":
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.PROMPT_ENG,
                        severity=Severity.PASS,
                        rule_name="Nodo IA Multimedia (Transcripción)",
                        node_name=node_name,
                        node_type=node_type,
                        message="Nodo configurado para transcripción de audio (no requiere System Prompt extenso).",
                        recommendation="Configuración correcta."
                    ))
                    continue

                if len(combined_context) < 60:
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.PROMPT_ENG,
                        severity=Severity.WARNING,
                        rule_name="Calidad de Contexto en Prompt (Prompt Débil o Vacío)",
                        node_name=node_name,
                        node_type=node_type,
                        message=f"El prompt/systemMessage configurado es demasiado breve ({len(combined_context)} caracteres) o carece de instrucciones de rol y restricciones.",
                        recommendation="Defina un `systemMessage` detallado con rol, delimitadores claros (ej. etiquetas XML `<instrucciones>`), restricciones operativas y formato de salida esperado."
                    ))
                else:
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.PROMPT_ENG,
                        severity=Severity.PASS,
                        rule_name="Estructura y Contexto del Prompt",
                        node_name=node_name,
                        node_type=node_type,
                        message=f"El nodo IA cuenta con un contexto robusto ({len(combined_context)} caracteres).",
                        recommendation="Excelente definición de instrucciones y contexto para el LLM."
                    ))

            # B. Evaluación de Herramientas (Tools) para Agentes
            is_tool_node = "tool" in node_type_lower
            if is_tool_node:
                tool_desc = str(
                    params.get("description", params.get("toolDescription", options.get("description", "")))
                ).strip()

                if len(tool_desc) < 20:
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.PROMPT_ENG,
                        severity=Severity.CRITICAL,
                        rule_name="Tool de Agente sin Descripción Explícita",
                        node_name=node_name,
                        node_type=node_type,
                        message="La herramienta (`Tool`) carece de una descripción clara o está vacía. El LLM del Agente no sabrá cuándo ni cómo invocarla.",
                        recommendation="Agregue una propiedad `description` explícita detallando qué hace la herramienta, cuándo debe usarla el Agente y qué argumentos espera."
                    ))
                else:
                    self.findings.append(AuditFinding(
                        engine=EngineCategory.PROMPT_ENG,
                        severity=Severity.PASS,
                        rule_name="Descripción Semántica de Tool",
                        node_name=node_name,
                        node_type=node_type,
                        message=f"La Tool posee una descripción explícita ({len(tool_desc)} caracteres).",
                        recommendation="Descripción adecuada para el enrutamiento del Agente."
                    ))


# =====================================================================
# 4. GENERADOR DE AUTO-REMEDIACIÓN (REFACTORIZACIÓN VISUAL JSON v1.0)
# =====================================================================

class WorkflowAutoRemediator:
    """
    Toma el JSON original de n8n e inyecta:
    1. Coloración roja ('color': '#FF0000') y notas visibles en el lienzo ('notesInFlow': True)
       sobre los nodos con vulnerabilidades críticas o advertencias.
    2. Nodos nativos 'n8n-nodes-base.stickyNote' posicionados junto a los nodos afectados
       y un resumen ejecutivo de auditoría en la esquina superior izquierda del flujo.
    """

    @staticmethod
    def generate_refactored_json(
            raw_json: Dict[str, Any],
            findings: List[AuditFinding],
            metrics: WorkflowMetrics
    ) -> str:
        refactored = copy.deepcopy(raw_json)
        nodes: List[Dict[str, Any]] = refactored.get("nodes", [])

        # Agrupar hallazgos problemáticos por nombre de nodo
        issues_by_node: Dict[str, List[AuditFinding]] = {}
        for f in findings:
            if f.severity in (Severity.CRITICAL, Severity.WARNING):
                issues_by_node.setdefault(f.node_name, []).append(f)

        min_x, min_y = 0, 0
        sticky_notes_to_inject: List[Dict[str, Any]] = []

        for node in nodes:
            pos = node.get("position", [0, 0])
            if isinstance(pos, list) and len(pos) == 2:
                min_x = min(min_x, int(pos[0]))
                min_y = min(min_y, int(pos[1]))

            node_name = str(node.get("name", ""))
            if node_name in issues_by_node:
                node_issues = issues_by_node[node_name]
                has_critical = any(i.severity == Severity.CRITICAL for i in node_issues)

                # Modificar propiedades visuales del nodo en el JSON de n8n
                node["color"] = "#FF2B2B" if has_critical else "#F59E0B"
                node["notesInFlow"] = True
                summary_notes = [f"[{i.severity.value}] {i.rule_name}" for i in node_issues]
                node["notes"] = " | ".join(summary_notes)

                # Crear Sticky Note de alerta justo encima del nodo afectado
                sticky_color = 3 if has_critical else 2  # En n8n: 3 = Rojo, 2 = Amarillo/Naranja
                badge = "🚨 VULNERABILIDAD CRÍTICA" if has_critical else "⚠️ ADVERTENCIA QA"
                bullet_list = "\n".join(
                    [f"- **{i.rule_name}**: {i.message}\n  * Fix: {i.recommendation}" for i in node_issues]
                )

                sticky_notes_to_inject.append({
                    "parameters": {
                        "content": f"### {badge}: `{node_name}`\n{bullet_list}",
                        "height": 220,
                        "width": 360,
                        "color": sticky_color
                    },
                    "id": str(uuid.uuid4()),
                    "name": f"QA Audit - {node_name[:25]}",
                    "type": "n8n-nodes-base.stickyNote",
                    "typeVersion": 1,
                    "position": [int(pos[0]) - 40, int(pos[1]) - 250]
                })

        # Agregar una Sticky Note Maestra con el resumen de auditoría global
        global_issues = issues_by_node.get("Global", [])
        global_bullets = "\n".join(
            [f"- **[{i.severity.value}] {i.rule_name}**: {i.recommendation}" for i in global_issues]
        ) or "- Sin hallazgos arquitectónicos globales pendientes."

        master_sticky = {
            "parameters": {
                "content": (
                    f"## 🛡️ Reporte de Auditoría QA & DevSecOps (n8n v2.15.0)\n"
                    f"**Flujo:** `{metrics.workflow_name}`\n"
                    f"- **Total Nodos:** {metrics.total_nodes} | **Conexiones:** {metrics.total_connections}\n"
                    f"- **Críticos:** {metrics.critical_count} | **Advertencias:** {metrics.warning_count}\n\n"
                    f"### Recomendaciones Globales:\n{global_bullets}"
                ),
                "height": 300,
                "width": 460,
                "color": 3 if metrics.critical_count > 0 else (2 if metrics.warning_count > 0 else 4)
            },
            "id": str(uuid.uuid4()),
            "name": "QA & DevSecOps Report",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [min_x - 520, min_y - 100]
        }

        nodes.append(master_sticky)
        nodes.extend(sticky_notes_to_inject)
        refactored["nodes"] = nodes

        return json.dumps(refactored, indent=2, ensure_ascii=False)


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