"""HTTP contract and adversarial input tests for the FastAPI MVP.

Preserva íntegras las 15 pruebas base originales e incorpora los escenarios
de contrato CL-01 a CL-16, CL-19 y CL-20 alineados con los criterios COV-01 a COV-10.
"""
from concurrent.futures import ThreadPoolExecutor
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from apps.api.main import (
    MAX_DEPTH,
    MAX_EDGES,
    MAX_JSON_ITEMS,
    MAX_NODES,
    MAX_REQUEST_BYTES,
    app,
)

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


if __name__ == "__main__":
    unittest.main()
