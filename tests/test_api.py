"""HTTP contract and adversarial input tests for the FastAPI MVP.

Preserva íntegras las 15 pruebas base originales e incorpora los escenarios
de contrato CL-01 a CL-16, CL-19, CL-20 alineados con los criterios COV-01 a COV-10,
más las correcciones AUD11-01 a AUD11-07 del incremento INC-01-R1.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from apps.api.main import (
    MAX_DEPTH,
    MAX_EDGES,
    MAX_JSON_ITEMS,
    MAX_NODES,
    MAX_REQUEST_BYTES,
    app,
)
from packages.qa_engine import EngineCategory, Severity

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

WORKFLOW = {
    "name": "Webhook smoke",
    "nodes": [
        {"id": "1", "name": "Trigger", "type": "n8n-nodes-base.webhook",
         "position": [0, 0], "parameters": {}},
        {"id": "2", "name": "End", "type": "n8n-nodes-base.noOp",
         "position": [200, 0], "parameters": {}},
    ],
    "connections": {
        "Trigger": {"main": [[{"node": "End", "type": "main", "index": 0}]]}
    },
}


class ApiTests(unittest.TestCase):
    # -------------------------------------------------------------------------
    # SUITE BASE ORIGINAL (PRESERVADA SIN CAMBIOS SEMÁNTICOS - COV-08)
    # -------------------------------------------------------------------------

    def test_health(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_audits_returns_metrics_and_findings(self):
        response = client.post("/api/v1/audits", json={"workflow": WORKFLOW})
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["metrics"]["total_nodes"], 2)
        self.assertEqual(data["metrics"]["total_connections"], 1)
        self.assertTrue(data["findings"])
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_rejects_invalid_shape(self):
        for body in ({"workflow": []}, {"workflow": {"nodes": []}}, {"workflow": WORKFLOW, "other": 1}):
            with self.subTest(body=body):
                self.assertEqual(client.post("/api/v1/audits", json=body).status_code, 422)

    def test_rejects_duplicate_node_names(self):
        workflow = {"name": "bad", "nodes": [
            {"name": "X", "type": "n8n-nodes-base.noOp"},
            {"name": "X", "type": "n8n-nodes-base.noOp"}], "connections": {}}
        self.assertEqual(client.post("/api/v1/audits", json={"workflow": workflow}).status_code, 422)

    def test_rejects_unknown_connection(self):
        workflow = {**WORKFLOW, "connections": {"Trigger": {"main": [[{"node": "Unknown"}]]}}}
        self.assertEqual(client.post("/api/v1/audits", json={"workflow": workflow}).status_code, 422)

    def test_rejects_non_json_body(self):
        response = client.post("/api/v1/audits", content="hello", headers={"Content-Type": "text/plain"})
        self.assertEqual(response.status_code, 415)

    def test_rejects_malformed_json(self):
        response = client.post("/api/v1/audits", content="{bad", headers={"Content-Type": "application/json"})
        self.assertEqual(response.status_code, 400)

    def test_rejects_oversized_request(self):
        response = client.post(
            "/api/v1/audits", content=b"x" * (1_048_577),
            headers={"Content-Type": "application/json"})
        self.assertEqual(response.status_code, 413)

    def test_rejects_too_many_nodes(self):
        nodes = [{"name": f"N{i}", "type": "n8n-nodes-base.noOp"} for i in range(MAX_NODES + 1)]
        response = client.post("/api/v1/audits", json={"workflow": {"name": "large", "nodes": nodes}})
        self.assertEqual(response.status_code, 422)

    # -------------------------------------------------------------------------
    # INC-01: ESCENARIOS DE CONTRATO Y LÍMITES (CL-01 A CL-16, CL-19, CL-20)
    # -------------------------------------------------------------------------

    # CL-01 (P0), COV-01: Content-Length: 0 con cuerpo vacío es rechazado con 400
    def test_cl01_rejects_empty_body_with_zero_content_length(self):
        response = client.post(
            "/api/v1/audits",
            content=b"",
            headers={"Content-Type": "application/json", "Content-Length": "0"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "El cuerpo no es JSON válido.")

    # CL-02 (P0), COV-01: Transferencia sin Content-Length numérico válido o ausente
    def test_cl02_content_length_header_validation(self):
        # Header no numérico produce 400 por cabecera inválida
        res_invalid_header = client.post(
            "/api/v1/audits",
            content=b"{}",
            headers={"Content-Type": "application/json", "Content-Length": "invalido"}
        )
        self.assertEqual(res_invalid_header.status_code, 400)
        self.assertEqual(res_invalid_header.json()["detail"], "Content-Length inválido.")

        # Cuerpo vacío sin Content-Length explícito es rechazado al parsear JSON
        res_empty = client.post(
            "/api/v1/audits",
            content=b"",
            headers={"Content-Type": "application/json"}
        )
        self.assertEqual(res_empty.status_code, 400)
        self.assertEqual(res_empty.json()["detail"], "El cuerpo no es JSON válido.")

    # CL-03 (P0), COV-01, COV-07: Workflow de 1 solo nodo sin conexiones
    def test_cl03_accepts_minimal_single_node_workflow(self):
        fixture_path = FIXTURES_DIR / "workflow_minimal.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        response = client.post("/api/v1/audits", json={"workflow": workflow})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["engine_version"], "static-v1")
        self.assertEqual(data["metrics"]["total_nodes"], 1)
        self.assertEqual(data["metrics"]["total_connections"], 0)
        findings = [f["rule_name"] for f in data["findings"]]
        self.assertIn("Regla de Integridad (Trigger Sin Salida)", findings)

    # CL-04 (P1), COV-02: Límite exacto superior de 150 nodos aceptado
    def test_cl04_accepts_exactly_max_nodes(self):
        fixture_path = FIXTURES_DIR / "workflow_150_nodes.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        self.assertEqual(len(workflow["nodes"]), MAX_NODES)
        response = client.post("/api/v1/audits", json={"workflow": workflow})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["metrics"]["total_nodes"], MAX_NODES)

    # CL-05 (P1), COV-02: Límite superior de 151 nodos rechazado
    def test_cl05_rejects_nodes_exceeding_max_limit(self):
        nodes = [{"name": f"N{i}", "type": "n8n-nodes-base.noOp"} for i in range(MAX_NODES + 1)]
        response = client.post("/api/v1/audits", json={"workflow": {"name": "overflow", "nodes": nodes}})
        self.assertEqual(response.status_code, 422)
        self.assertIn(f"nodes debe contener entre 1 y {MAX_NODES} nodos.", response.json()["detail"])

    # CL-06 (P0), COV-06: Position con valores no finitos o que superan 1e9 (1e999 / -1e999 / >1e9)
    def test_cl06_rejects_non_finite_positions(self):
        # 1e999 y -1e999 son sintaxis JSON válida que python json.loads() parsea como float('inf') / float('-inf')
        for raw_pos in ("[1e999, 0]", "[0, -1e999]", "[1000000001, 0]"):
            with self.subTest(pos=raw_pos):
                raw_body = (
                    '{"workflow": {"name": "Test", "nodes": [{"id": "1", "name": "Trigger", '
                    '"type": "n8n-nodes-base.webhook", "position": ' + raw_pos + ', "parameters": {}}], '
                    '"connections": {}}}'
                )
                response = client.post(
                    "/api/v1/audits",
                    content=raw_body.encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                self.assertEqual(response.status_code, 422)
                self.assertIn("position debe tener dos números finitos", response.json()["detail"])

    # CL-07 (P0), COV-06: Position con booleanos en lugar de números
    def test_cl07_rejects_boolean_values_in_position(self):
        for invalid_pos in ([True, 0], [100, False], [True, False]):
            with self.subTest(pos=invalid_pos):
                wf = copy.deepcopy(WORKFLOW)
                wf["nodes"][0]["position"] = invalid_pos
                response = client.post("/api/v1/audits", json={"workflow": wf})
                self.assertEqual(response.status_code, 422)
                self.assertIn("position debe tener dos números finitos", response.json()["detail"])

    # CL-08 (P1): Nombre de nodo de longitud exacta 200 caracteres (aceptado)
    def test_cl08_accepts_node_name_exact_200_chars(self):
        wf = copy.deepcopy(WORKFLOW)
        name_200 = "N" * 200
        wf["nodes"][0]["name"] = name_200
        wf["connections"] = {name_200: {"main": [[{"node": "End", "type": "main", "index": 0}]]}}
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 200)

    # CL-09 (P1): Nombre de nodo de 201 caracteres (rechazado con 422)
    def test_cl09_rejects_node_name_exceeding_200_chars(self):
        wf = copy.deepcopy(WORKFLOW)
        name_201 = "N" * 201
        wf["nodes"][0]["name"] = name_201
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 422)
        self.assertIn("máximo 200 caracteres", response.json()["detail"])

    # CL-10 (P1), COV-02: Profundidad JSON máxima permitida (depth=32, extra_depth=29)
    def test_cl10_accepts_exact_max_depth(self):
        cur = {}
        for _ in range(29):
            cur = {"a": cur}
        wf = copy.deepcopy(WORKFLOW)
        wf["nodes"][0]["parameters"] = cur

        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 200)

    # CL-11 (P1), COV-02: Profundidad JSON superada (depth=33, extra_depth=30)
    def test_cl11_rejects_depth_exceeding_limit(self):
        cur = {}
        for _ in range(30):
            cur = {"a": cur}
        wf = copy.deepcopy(WORKFLOW)
        wf["nodes"][0]["parameters"] = cur

        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 422)
        self.assertIn("El JSON supera el nivel máximo de anidamiento.", response.json()["detail"])

    # CL-12 (P1), COV-02: Límite exacto de 2.000 conexiones aceptado
    def test_cl12_accepts_exact_max_edges(self):
        wf = {
            "name": "2000 edges",
            "nodes": [
                {"name": "Source", "type": "n8n-nodes-base.webhook", "position": [0, 0]},
                {"name": "Target", "type": "n8n-nodes-base.noOp", "position": [100, 0]},
            ],
            "connections": {
                "Source": {
                    "main": [
                        [{"node": "Target", "type": "main", "index": 0}] * MAX_EDGES
                    ]
                }
            }
        }
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["metrics"]["total_connections"], MAX_EDGES)

    # CL-13 (P1), COV-02: Límite de 2.001 conexiones rechazado
    def test_cl13_rejects_edges_exceeding_max_limit(self):
        wf = {
            "name": "2001 edges",
            "nodes": [
                {"name": "Source", "type": "n8n-nodes-base.webhook", "position": [0, 0]},
                {"name": "Target", "type": "n8n-nodes-base.noOp", "position": [100, 0]},
            ],
            "connections": {
                "Source": {
                    "main": [
                        [{"node": "Target", "type": "main", "index": 0}] * (MAX_EDGES + 1)
                    ]
                }
            }
        }
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 422)
        self.assertIn(f"El workflow supera {MAX_EDGES} conexiones.", response.json()["detail"])

    # CL-14 (P0): Conexiones con puertos malformados (no diccionario)
    def test_cl14_rejects_invalid_connection_port_structure(self):
        wf = copy.deepcopy(WORKFLOW)
        wf["connections"]["Trigger"] = ["puerto_invalido_como_lista"]
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 422)
        self.assertIn("puertos inválidos", response.json()["detail"])

    # CL-15 (P0), COV-06: Settings con valor explícito null
    def test_cl15_rejects_null_settings(self):
        wf = copy.deepcopy(WORKFLOW)
        wf["settings"] = None
        response = client.post("/api/v1/audits", json={"workflow": wf})
        self.assertEqual(response.status_code, 422)
        self.assertIn("settings debe ser un objeto JSON.", response.json()["detail"])

    # CL-16 (P1), COV-02: Límite estricto de 1 MiB (exacto 1048576 vs 1048577 bytes)
    def test_cl16_exact_1mib_boundary_validation(self):
        node_base = {"name": "A", "type": "t", "position": [0, 0], "parameters": {"pad": ""}}
        base_body = {"workflow": {"name": "x", "nodes": [node_base], "connections": {}}}
        base_bytes = json.dumps(base_body).encode("utf-8")
        pad_len = MAX_REQUEST_BYTES - len(base_bytes)

        # 1. Exactamente 1 MiB (1_048_576 bytes) -> HTTP 200
        node_exact = {"name": "A", "type": "t", "position": [0, 0], "parameters": {"pad": "X" * pad_len}}
        body_exact = json.dumps({"workflow": {"name": "x", "nodes": [node_exact], "connections": {}}}).encode("utf-8")
        self.assertEqual(len(body_exact), MAX_REQUEST_BYTES)

        res_exact = client.post(
            "/api/v1/audits",
            content=body_exact,
            headers={"Content-Type": "application/json", "Content-Length": str(len(body_exact))}
        )
        self.assertEqual(res_exact.status_code, 200)

        # 2. Exactamente 1 MiB + 1 byte (1_048_577 bytes) -> HTTP 413
        node_over = {"name": "A", "type": "t", "position": [0, 0], "parameters": {"pad": "X" * (pad_len + 1)}}
        body_over = json.dumps({"workflow": {"name": "x", "nodes": [node_over], "connections": {}}}).encode("utf-8")
        self.assertEqual(len(body_over), MAX_REQUEST_BYTES + 1)

        res_over = client.post(
            "/api/v1/audits",
            content=body_over,
            headers={"Content-Type": "application/json", "Content-Length": str(len(body_over))}
        )
        self.assertEqual(res_over.status_code, 413)
        self.assertEqual(res_over.json()["detail"], "El JSON excede 1 MiB.")

    # CL-19 (P0), COV-03, COV-07: Workflow representativo sintético end-to-end
    def test_cl19_representative_synthetic_workflow_contract(self):
        fixture_path = FIXTURES_DIR / "workflow_representative_synthetic.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        response = client.post("/api/v1/audits", json={"workflow": workflow})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["engine_version"], "static-v1")
        self.assertEqual(data["metrics"]["workflow_name"], "Workflow representativo sintetico KevoLint")
        self.assertEqual(data["metrics"]["total_nodes"], 9)
        self.assertGreater(data["metrics"]["total_connections"], 0)
        self.assertIsInstance(data["findings"], list)

    # CL-20 (P0), COV-05: Concurrencia de 10 peticiones simultáneas sin interferencia
    def test_cl20_concurrent_audit_requests(self):
        def _send_audit(index: int):
            wf = copy.deepcopy(WORKFLOW)
            wf["name"] = f"Workflow Concurrente {index}"
            res = client.post("/api/v1/audits", json={"workflow": wf})
            return index, res.status_code, res.json()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_send_audit, i) for i in range(10)]
            results = [f.result() for f in futures]

        for index, status, data in results:
            self.assertEqual(status, 200)
            self.assertEqual(data["metrics"]["workflow_name"], f"Workflow Concurrente {index}")
            self.assertEqual(data["metrics"]["total_nodes"], 2)

    # COV-01: Simulación de fallo 500 ofuscado sin filtración de datos internos
    @patch("apps.api.main._audit_workflow", side_effect=RuntimeError("Fallo interno simulado con clave secreta"))
    def test_cov01_simulated_internal_server_error_sanitization(self, _mock_audit):
        response = client.post("/api/v1/audits", json={"workflow": WORKFLOW})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["detail"], "Error interno de auditoría.")
        self.assertNotIn("clave secreta", response.text)

    # COV-02: Límite de 30.000 elementos JSON (30.000 aceptado, 30.001 rechazado)
    def test_cov02_json_items_limit(self):
        node_base = {"name": "A", "type": "t", "position": [0, 0], "parameters": {}}
        base_wf = {"name": "x", "nodes": [node_base], "connections": {}}

        # Base tiene 11 elementos contados en stack; añadimos lista para llegar exacto a 30.000
        # parameters: {'items': [1] * 29988} -> parameters dict (1), 'items' list (1), 29988 ints
        # 11 - 1 (empty params) + 1 + 1 + 29988 = 30000
        wf_exact = copy.deepcopy(base_wf)
        wf_exact["nodes"][0]["parameters"] = {"items": [1] * 29988}
        res_exact = client.post("/api/v1/audits", json={"workflow": wf_exact})
        self.assertEqual(res_exact.status_code, 200)

        # 30.001 elementos -> 422
        wf_over = copy.deepcopy(base_wf)
        wf_over["nodes"][0]["parameters"] = {"items": [1] * 29989}
        res_over = client.post("/api/v1/audits", json={"workflow": wf_over})
        self.assertEqual(res_over.status_code, 422)
        self.assertIn("El JSON contiene demasiados elementos.", res_over.json()["detail"])



# ---------------------------------------------------------------------------
# HELPERS ASGI (INC-01-R1): harness de pruebas ASGI con inspección de scope y chunks
# ---------------------------------------------------------------------------

def _asgi_request_tracked(
    body_or_stream,
    headers: dict | None = None,
    omit_content_length: bool = False,
):
    """Envía una petición POST sobre ASGI inspeccionando el scope y los chunks recibidos.

    Retorna:
    - response: httpx.Response
    - headers_received: dict de cabeceras en el scope ASGI (keys en minúsculas)
    - chunks_received: lista de tamaños (en bytes) de los chunks recibidos en 'http.request'
    """
    headers_received: dict[str, str] = {}
    chunks_received: list[int] = []

    async def tracking_app(scope, receive, send):
        if scope["type"] == "http":
            for raw_k, raw_v in scope.get("headers", []):
                headers_received[raw_k.decode("latin1").lower()] = raw_v.decode("latin1")

            async def wrapped_receive():
                msg = await receive()
                if msg.get("type") == "http.request":
                    chunks_received.append(len(msg.get("body", b"")))
                return msg

            await app(scope, wrapped_receive, send)
        else:
            await app(scope, receive, send)

    transport = httpx.ASGITransport(app=tracking_app)

    async def _send():
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            req_headers = {"content-type": "application/json"}
            if headers:
                req_headers.update(headers)
            content = body_or_stream() if callable(body_or_stream) else body_or_stream
            req = ac.build_request("POST", "/api/v1/audits", content=content, headers=req_headers)
            if omit_content_length and "content-length" in req.headers:
                del req.headers["content-length"]
            return await ac.send(req)

    response = asyncio.run(_send())
    return response, headers_received, chunks_received


class ApiAud11Tests(unittest.TestCase):
    """INC-01-R1: correcciones AUD11-01 a AUD11-07 de la auditoría Codex."""

    # -----------------------------------------------------------------------
    # AUD11-01: CL-02 — Comportamiento ASGI real sin Content-Length automático
    # -----------------------------------------------------------------------

    def test_aud11_01a_valid_json_without_content_length_returns_200(self):
        """CL-02 sub-A: JSON válido enviado sin Content-Length → HTTP 200.

        Verifica que el servidor acepta transferencias donde el cliente no
        declara Content-Length (streaming sin longitud preconocida).
        Demuestra mediante inspección del scope ASGI que Content-Length está efectivamente ausente.
        """
        body = json.dumps({"workflow": WORKFLOW}).encode("utf-8")
        response, scope_headers, _ = _asgi_request_tracked(body, omit_content_length=True)
        self.assertNotIn(
            "content-length", scope_headers,
            "Verificación de harness: Content-Length debe estar ausente del scope ASGI."
        )
        self.assertEqual(
            response.status_code, 200,
            f"Se esperaba 200 con JSON válido sin Content-Length. Body: {response.text}"
        )
        data = response.json()
        self.assertEqual(data["engine_version"], "static-v1")
        self.assertIn("metrics", data)
        self.assertIn("findings", data)

    def test_aud11_01b_invalid_content_length_header_returns_400(self):
        """CL-02 sub-B: Content-Length no numérico → HTTP 400.

        Demuestra que el valor erróneo llega al scope ASGI y el servidor lo rechaza con 400.
        """
        body = json.dumps({"workflow": WORKFLOW}).encode("utf-8")
        response, scope_headers, _ = _asgi_request_tracked(body, headers={"content-length": "invalido"})
        self.assertEqual(
            scope_headers.get("content-length"), "invalido",
            "Verificación de harness: la cabecera enviada debe coincidir con la recibida en el scope."
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Content-Length inválido.")

    def test_aud11_01c_empty_body_without_content_length_returns_400(self):
        """CL-02 sub-C: Cuerpo vacío sin Content-Length → HTTP 400 (JSON parse error).

        Demuestra que en ausencia de Content-Length, un cuerpo vacío se procesa
        por streaming y falla al parsear JSON sin arrojar excepciones no controladas.
        """
        response, scope_headers, _ = _asgi_request_tracked(b"", omit_content_length=True)
        self.assertNotIn(
            "content-length", scope_headers,
            "Verificación de harness: Content-Length debe estar ausente del scope ASGI."
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "El cuerpo no es JSON válido.")

    # -----------------------------------------------------------------------
    # AUD11-02: Límite 1 MiB verificado por streaming (sin Content-Length y chunks)
    # -----------------------------------------------------------------------

    def test_aud11_02a_body_over_1mib_without_content_length_returns_413(self):
        """AUD11-02 caso 3: body > 1 MiB sin Content-Length → HTTP 413.

        El check de tamaño debe activarse en la lectura por streaming
        incluso cuando el cliente no declara Content-Length.
        Demuestra mediante inspección del scope que Content-Length está ausente.
        """
        oversized_body = b"x" * (MAX_REQUEST_BYTES + 1)
        response, scope_headers, _ = _asgi_request_tracked(oversized_body, omit_content_length=True)
        self.assertNotIn(
            "content-length", scope_headers,
            "Verificación de harness: Content-Length debe estar ausente del scope ASGI."
        )
        self.assertEqual(
            response.status_code, 413,
            "El servidor debe rechazar con 413 un cuerpo > 1 MiB aunque no haya Content-Length."
        )
        self.assertEqual(response.json()["detail"], "El JSON excede 1 MiB.")

    def test_aud11_02b_body_over_1mib_with_subdeclared_content_length_returns_413(self):
        """AUD11-02 caso 4: body > 1 MiB con Content-Length subdeclarado → HTTP 413.

        El servidor debe rechazar por streaming cuando el header
        Content-Length declara un valor pequeño (100) pero el cuerpo real supera 1 MiB.
        Demuestra que la cabecera recibida en el scope fue '100'.
        """
        oversized_body = b"x" * (MAX_REQUEST_BYTES + 100)
        response, scope_headers, _ = _asgi_request_tracked(
            oversized_body, headers={"content-length": "100"}
        )
        self.assertEqual(
            scope_headers.get("content-length"), "100",
            "Verificación de harness: el scope ASGI debe registrar Content-Length: 100."
        )
        self.assertEqual(
            response.status_code, 413,
            "El servidor debe rechazar con 413 por streaming aunque Content-Length esté subdeclarado."
        )
        self.assertEqual(response.json()["detail"], "El JSON excede 1 MiB.")

    def test_aud11_02c_body_over_1mib_via_multiple_asgi_chunks_returns_413(self):
        """AUD11-02 caso 5: streaming en múltiples chunks ASGI sin Content-Length → HTTP 413.

        Envía un stream asíncrono real de 2 chunks de 600.000 bytes (total 1.200.000 bytes > 1 MiB).
        Demuestra que:
        - Content-Length está ausente en el scope ASGI.
        - Se recibieron múltiples chunks ASGI en el servidor.
        - El límite acumulado interrumpe la lectura con HTTP 413.
        """
        async def multi_chunks():
            yield b"x" * 600_000
            yield b"x" * 600_000

        response, scope_headers, chunks_received = _asgi_request_tracked(
            multi_chunks, omit_content_length=True
        )
        self.assertNotIn(
            "content-length", scope_headers,
            "Verificación de harness: Content-Length debe estar ausente en streaming por chunks."
        )
        self.assertGreaterEqual(
            len(chunks_received), 2,
            f"Se esperaba recibir al menos 2 chunks ASGI, pero se recibieron {len(chunks_received)}."
        )
        self.assertGreater(
            sum(chunks_received), MAX_REQUEST_BYTES,
            "El total de bytes acumulados en los chunks debe superar el límite de 1 MiB."
        )
        self.assertEqual(
            response.status_code, 413,
            "El servidor debe cortar la lectura con 413 al exceder el límite acumulado."
        )
        self.assertEqual(response.json()["detail"], "El JSON excede 1 MiB.")

    # -----------------------------------------------------------------------
    # AUD11-06: CL-19 — Aserciones concretas de findings y métricas
    # -----------------------------------------------------------------------

    def test_aud11_06_cl19_concrete_findings_and_metrics(self):
        """AUD11-06: CL-19 reformado con aserciones concretas de contrato.

        Verifica que el fixture representativo produce métricas coherentes,
        hallazgos de los 4 motores y encabezados de seguridad garantizados.
        """
        fixture_path = FIXTURES_DIR / "workflow_representative_synthetic.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        response = client.post("/api/v1/audits", json={"workflow": workflow})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Encabezados de seguridad garantizados en respuesta exitosa
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")

        # Metadatos de versión
        self.assertEqual(data["engine_version"], "static-v1")

        # Métricas del fixture: 9 nodos, 8 conexiones (verificado empíricamente)
        metrics = data["metrics"]
        self.assertEqual(metrics["total_nodes"], 9)
        self.assertEqual(metrics["total_connections"], 8)
        self.assertEqual(metrics["workflow_name"], "Workflow representativo sintetico KevoLint")

        # Los contadores de severidad deben ser coherentes con los findings reales
        findings = data["findings"]
        self.assertIsInstance(findings, list)
        self.assertGreater(len(findings), 0)

        actual_critical = sum(1 for f in findings if f["severity"] == Severity.CRITICAL.value)
        actual_warning = sum(1 for f in findings if f["severity"] == Severity.WARNING.value)
        actual_pass = sum(1 for f in findings if f["severity"] == Severity.PASS.value)
        self.assertEqual(metrics["critical_count"], actual_critical)
        self.assertEqual(metrics["warning_count"], actual_warning)
        self.assertEqual(metrics["pass_count"], actual_pass)

        # Los 4 motores deben estar representados en los hallazgos
        engines_present = {f["engine"] for f in findings}
        self.assertIn("1. Ciberseguridad e Integraciones", engines_present)
        self.assertIn("2. Arquitectura y Escalabilidad", engines_present)
        self.assertIn("3. Lógica y Flujo de Datos", engines_present)
        self.assertIn("4. Prompt Engineering (Agentes IA)", engines_present)

        # Todos los hallazgos tienen los campos obligatorios del contrato
        required_fields = (
            "engine", "severity", "rule_name",
            "node_name", "node_type", "message", "recommendation"
        )
        for finding in findings:
            for field in required_fields:
                self.assertIn(
                    field, finding,
                    f"Campo obligatorio '{field}' ausente en finding: {finding}"
                )

        # AUD11-06: Verificación explícita de identidad de reglas y severidad esperadas
        finding_tuples = {
            (f["engine"], f["rule_name"], f["severity"])
            for f in findings
        }
        expected_findings = [
            (EngineCategory.SECURITY.value, "Higiene de Credenciales y Secretos", Severity.PASS.value),
            (EngineCategory.ARCHITECTURE.value, "Regla de Modularidad", Severity.PASS.value),
            (EngineCategory.ARCHITECTURE.value, "Regla de Resiliencia", Severity.PASS.value),
            (EngineCategory.DATA_LOGIC.value, "Integridad de Grafo y Control de Lotes", Severity.PASS.value),
            (EngineCategory.PROMPT_ENG.value, "Estructura y Contexto del Prompt", Severity.PASS.value),
        ]
        for engine, rule_name, severity in expected_findings:
            self.assertIn(
                (engine, rule_name, severity),
                finding_tuples,
                f"Regla esperada no encontrada o con atributos incorrectos: {(engine, rule_name, severity)}"
            )

        # El fixture es limpio: no debe haber ningún CRÍTICO
        self.assertEqual(actual_critical, 0, "El fixture representativo no debe generar hallazgos CRÍTICOS.")

    # -----------------------------------------------------------------------
    # AUD11-07: Concurrencia con payloads variados sin contaminación cruzada
    # -----------------------------------------------------------------------

    def test_aud11_07_concurrent_varied_payloads_no_cross_contamination(self):
        """AUD11-07: 10 peticiones concurrentes con 4 tipos de workflow distintos.

        Verifica aislamiento de estado entre peticiones concurrentes:
        - Tipo A (clean): sin hallazgos CRÍTICOS de seguridad.
        - Tipo B (secret): hallazgo CRÍTICO de credenciales hardcodeadas.
        - Tipo C (large): WARNING de modularidad (> 20 nodos).
        - Tipo D (dead branch): WARNING de ruta muerta en If.
        """
        # Tipo A: webhook → noOp, sin secretos
        wf_a = {
            "name": "Concurrent-A",
            "nodes": [
                {"name": "T", "type": "n8n-nodes-base.webhook", "position": [0, 0], "parameters": {}},
                {"name": "E", "type": "n8n-nodes-base.noOp", "position": [100, 0], "parameters": {}},
            ],
            "connections": {"T": {"main": [[{"node": "E", "type": "main", "index": 0}]]}},
        }

        # Tipo B: HTTP con Bearer hardcodeado → CRÍTICO de seguridad
        wf_b = {
            "name": "Concurrent-B",
            "nodes": [
                {
                    "name": "HTTP",
                    "type": "n8n-nodes-base.httpRequest",
                    "position": [0, 0],
                    "parameters": {
                        "headers": {
                            "Authorization": "Bearer SYNTHETIC_FAKE_TOKEN_INC01R1_NOT_REAL_AAABBB"
                        }
                    },
                }
            ],
            "connections": {},
        }

        # Tipo C: 25 nodos → WARNING de modularidad (> 20)
        wf_c = {
            "name": "Concurrent-C",
            "nodes": [
                {"name": f"N{i}", "type": "n8n-nodes-base.noOp", "position": [i * 50, 0], "parameters": {}}
                for i in range(25)
            ],
            "connections": {},
        }

        # Tipo D: If con rama False desconectada → WARNING ruta muerta
        wf_d = {
            "name": "Concurrent-D",
            "nodes": [
                {"name": "Check", "type": "n8n-nodes-base.if", "position": [0, 0], "parameters": {}},
                {"name": "Done", "type": "n8n-nodes-base.noOp", "position": [200, 0], "parameters": {}},
            ],
            "connections": {
                "Check": {"main": [[{"node": "Done", "type": "main", "index": 0}], []]}
            },
        }

        types = [wf_a, wf_b, wf_c, wf_d]

        def _send(idx: int):
            wf = copy.deepcopy(types[idx % 4])
            wf["name"] = f"{wf['name']}-{idx}"
            resp = client.post("/api/v1/audits", json={"workflow": wf})
            return idx, resp.status_code, resp.json(), idx % 4

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_send, i) for i in range(10)]
            results = [f.result() for f in futures]

        for idx, status, data, wf_type in results:
            self.assertEqual(status, 200, f"Request {idx} (type {wf_type}) falló con {status}")
            findings = data["findings"]
            rule_names = {f["rule_name"] for f in findings}

            if wf_type == 0:  # Tipo A: clean (2 nodos)
                self.assertEqual(
                    data["metrics"]["total_nodes"], 2,
                    f"Request {idx} (Tipo A) debe tener exactamente 2 nodos."
                )
                # Presencia de hallazgos específicos esperados en flujo limpio
                self.assertIn("Higiene de Credenciales y Secretos", rule_names)
                self.assertIn("Integridad de Grafo y Control de Lotes", rule_names)
                # Ausencia de hallazgos exclusivos de los otros tipos
                self.assertNotIn("Credenciales Hardcodeadas en Parámetros", rule_names)
                self.assertNotIn("Regla de Modularidad (Complejidad Monolítica)", rule_names)
                self.assertNotIn("Regla de Integridad (Ruta Muerta en Nodo If)", rule_names)

            elif wf_type == 1:  # Tipo B: secret (1 nodo)
                self.assertEqual(
                    data["metrics"]["total_nodes"], 1,
                    f"Request {idx} (Tipo B) debe tener exactamente 1 nodo."
                )
                # Presencia de hallazgos específicos de credenciales expuestas
                self.assertIn("Credenciales Hardcodeadas en Parámetros", rule_names)
                security_critical = [
                    f for f in findings
                    if f["engine"] == "1. Ciberseguridad e Integraciones"
                    and f["severity"] == Severity.CRITICAL.value
                ]
                self.assertGreater(
                    len(security_critical), 0,
                    f"Tipo B debe tener al menos un hallazgo CRÍTICO de seguridad en request {idx}"
                )
                # Ausencia de hallazgos exclusivos de los otros tipos
                self.assertNotIn("Higiene de Credenciales y Secretos", rule_names)
                self.assertNotIn("Regla de Modularidad (Complejidad Monolítica)", rule_names)
                self.assertNotIn("Regla de Integridad (Ruta Muerta en Nodo If)", rule_names)
                # Verificación estricta de no filtración del token sintético en toda la respuesta
                all_text = json.dumps(data)
                self.assertNotIn(
                    "SYNTHETIC_FAKE_TOKEN_INC01R1_NOT_REAL_AAABBB",
                    all_text,
                    f"El token sintético NO debe aparecer en ningún campo de la respuesta (request {idx})"
                )

            elif wf_type == 2:  # Tipo C: 25 nodos (complejidad monolítica)
                self.assertEqual(
                    data["metrics"]["total_nodes"], 25,
                    f"Request {idx} (Tipo C) debe tener exactamente 25 nodos."
                )
                # Presencia de hallazgo específico de modularidad
                self.assertIn("Regla de Modularidad (Complejidad Monolítica)", rule_names)
                arch_warnings = [
                    f for f in findings
                    if f["engine"] == "2. Arquitectura y Escalabilidad"
                    and f["severity"] == Severity.WARNING.value
                    and "Modularidad" in f["rule_name"]
                ]
                self.assertGreater(
                    len(arch_warnings), 0,
                    f"Tipo C (25 nodos) debe tener WARNING de Modularidad en request {idx}"
                )
                # Ausencia de hallazgos exclusivos de los otros tipos
                self.assertNotIn("Regla de Modularidad", rule_names)  # PASS no debe figurar
                self.assertNotIn("Credenciales Hardcodeadas en Parámetros", rule_names)
                self.assertNotIn("Regla de Integridad (Ruta Muerta en Nodo If)", rule_names)

            elif wf_type == 3:  # Tipo D: If con ruta muerta (2 nodos)
                self.assertEqual(
                    data["metrics"]["total_nodes"], 2,
                    f"Request {idx} (Tipo D) debe tener exactamente 2 nodos."
                )
                # Presencia de hallazgo específico de ruta muerta en If con motor y severidad explícitos
                self.assertIn("Regla de Integridad (Ruta Muerta en Nodo If)", rule_names)
                dead_route_findings = [
                    f for f in findings
                    if f["rule_name"] == "Regla de Integridad (Ruta Muerta en Nodo If)"
                ]
                self.assertEqual(
                    len(dead_route_findings), 1,
                    f"Tipo D debe tener exactamente 1 hallazgo de 'Regla de Integridad (Ruta Muerta en Nodo If)' en request {idx}"
                )
                dr_finding = dead_route_findings[0]
                self.assertEqual(
                    dr_finding["engine"],
                    EngineCategory.DATA_LOGIC.value,
                    f"Motor incorrecto en hallazgo de ruta muerta (request {idx}): {dr_finding['engine']}"
                )
                self.assertEqual(
                    dr_finding["severity"],
                    Severity.WARNING.value,
                    f"Severidad incorrecta en hallazgo de ruta muerta (request {idx}): {dr_finding['severity']}"
                )
                # Ausencia de hallazgos exclusivos de los otros tipos
                self.assertNotIn("Credenciales Hardcodeadas en Parámetros", rule_names)
                self.assertNotIn("Regla de Modularidad (Complejidad Monolítica)", rule_names)

            # Invariante universal: workflow_name no debe contaminarse
            self.assertEqual(
                data["metrics"]["workflow_name"],
                f"{['Concurrent-A', 'Concurrent-B', 'Concurrent-C', 'Concurrent-D'][wf_type]}-{idx}",
                f"Contaminación de estado detectada en request {idx} (tipo {wf_type})"
            )


if __name__ == "__main__":
    unittest.main()
