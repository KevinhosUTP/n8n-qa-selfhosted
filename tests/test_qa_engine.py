"""Regression smoke and engine contract tests for the extracted n8n QA engine.

Preserva íntegras las 6 pruebas base originales e incorpora los escenarios
CL-17, CL-18 y validación completa de los cuatro motores (COV-03 y COV-04).
"""
import json
from pathlib import Path
import unittest

from packages.qa_engine import (
    AuditFinding,
    EngineCategory,
    N8nAuditOrchestrator,
    N8nWorkflowParser,
    Severity,
    WorkflowAutoRemediator,
    WorkflowMetrics,
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


class EngineSmokeTests(unittest.TestCase):
    # -------------------------------------------------------------------------
    # SUITE BASE ORIGINAL (PRESERVADA SIN CAMBIOS SEMÁNTICOS - COV-08)
    # -------------------------------------------------------------------------

    def setUp(self):
        self.workflow = {
            "name": "Basic webhook",
            "nodes": [
                {"id": "1", "name": "Trigger", "type": "n8n-nodes-base.webhook", "position": [0, 0], "parameters": {}},
                {"id": "2", "name": "End", "type": "n8n-nodes-base.noOp", "position": [200, 0], "parameters": {}},
            ],
            "connections": {"Trigger": {"main": [[{"node": "End", "type": "main", "index": 0}]]}},
        }

    def test_parser_counts_nodes_and_connections(self):
        parser = N8nWorkflowParser(self.workflow)
        self.assertEqual(len(parser.nodes), 2)
        self.assertEqual(parser.total_connections_count, 1)
        self.assertIn("End", parser.outbound_all["Trigger"])

    def test_orchestrator_produces_findings(self):
        findings = N8nAuditOrchestrator(N8nWorkflowParser(self.workflow)).run_all_engines()
        self.assertTrue(findings)
        self.assertTrue(all(hasattr(f, "severity") for f in findings))

    def test_annotation_does_not_mutate_original(self):
        findings = N8nAuditOrchestrator(N8nWorkflowParser(self.workflow)).run_all_engines()
        metrics = WorkflowMetrics(self.workflow["name"], 2, 1,
            sum(f.severity == Severity.CRITICAL for f in findings),
            sum(f.severity == Severity.WARNING for f in findings),
            sum(f.severity == Severity.PASS for f in findings))
        original_count = len(self.workflow["nodes"])
        output = json.loads(WorkflowAutoRemediator.generate_refactored_json(self.workflow, findings, metrics))
        self.assertEqual(len(self.workflow["nodes"]), original_count)
        self.assertGreater(len(output["nodes"]), original_count)

    def test_security_engine_detects_secret_without_revealing_value(self):
        workflow = dict(self.workflow)
        workflow["nodes"] = [
            {"id": "1", "name": "HTTP", "type": "n8n-nodes-base.httpRequest",
             "position": [0, 0],
             "parameters": {"headers": {"Authorization": "Bearer very_private_token_123456"}}}
        ]
        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        security = [f for f in findings if "Ciberseguridad" in f.engine.value]
        self.assertTrue(any(f.severity == Severity.CRITICAL for f in security))
        self.assertNotIn("very_private_token_123456", "\n".join(f.message for f in findings))

    def test_logic_engine_flags_unconnected_if_branch(self):
        workflow = {
            "name": "Incomplete IF",
            "nodes": [
                {"id": "1", "name": "Check", "type": "n8n-nodes-base.if",
                 "position": [0, 0], "parameters": {}},
                {"id": "2", "name": "Done", "type": "n8n-nodes-base.noOp",
                 "position": [200, 0], "parameters": {}},
            ],
            "connections": {
                "Check": {"main": [[{"node": "Done", "type": "main", "index": 0}], []]}
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        self.assertTrue(any("Ruta Muerta en Nodo If" in f.rule_name for f in findings))

    def test_ai_engine_flags_tool_with_missing_description(self):
        workflow = {
            "name": "Agent tool",
            "nodes": [
                {"id": "1", "name": "Tool", "type": "@n8n/n8n-nodes-langchain.toolCalculator",
                 "position": [0, 0], "parameters": {}}
            ],
            "connections": {},
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        self.assertTrue(any("Tool de Agente sin Descripción" in f.rule_name for f in findings))

    # -------------------------------------------------------------------------
    # INC-01: ESCENARIOS CL-17, CL-18, Y COBERTURA MOTORES (COV-03 Y COV-04)
    # -------------------------------------------------------------------------

    # CL-17 (P0), COV-03: Switch con fallbackOutput configurado pero sin conectar
    def test_cl17_switch_with_unconnected_fallback_output(self):
        workflow = {
            "name": "Switch with disconnected fallback",
            "nodes": [
                {
                    "name": "Decision",
                    "type": "n8n-nodes-base.switch",
                    "position": [0, 0],
                    "parameters": {
                        "rules": {"values": [{"v": "1"}]},
                        "options": {"fallbackOutput": "extra"}
                    }
                },
                {
                    "name": "Connected Node",
                    "type": "n8n-nodes-base.noOp",
                    "position": [200, 0]
                }
            ],
            "connections": {
                "Decision": {
                    "main": [
                        [{"node": "Connected Node", "type": "main", "index": 0}],
                        []  # Rama fallback (índice 1) sin destino conectado
                    ]
                }
            }
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        switch_findings = [f for f in findings if "Ruta Muerta en Nodo Switch" in f.rule_name]
        self.assertTrue(switch_findings, "Se esperaba hallazgo por salida fallback de Switch no conectada")
        self.assertEqual(switch_findings[0].severity, Severity.WARNING)

    # CL-18 (P1), COV-04: Nodo bulk seguido de splitInBatches dentro de profundidad <= 2
    def test_cl18_bulk_node_with_batching_control_passes_oom_check(self):
        workflow = {
            "name": "Bulk with batching downstream",
            "nodes": [
                {
                    "name": "Fetch Records",
                    "type": "n8n-nodes-base.httpRequest",
                    "position": [0, 0],
                    "parameters": {"operation": "getAll"}
                },
                {
                    "name": "Batch Loop",
                    "type": "n8n-nodes-base.splitInBatches",
                    "position": [200, 0],
                    "parameters": {"batchSize": 50}
                }
            ],
            "connections": {
                "Fetch Records": {"main": [[{"node": "Batch Loop", "type": "main", "index": 0}]]}
            }
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        oom_findings = [f for f in findings if "Riesgo OOM" in f.rule_name]
        self.assertEqual(len(oom_findings), 0, "No debe emitir advertencia de OOM si tiene splitInBatches downstream")

    # COV-03 y COV-04: Validación completa de hallazgos y PASS en los 4 motores
    def test_cov03_cov04_all_four_engines_with_representative_synthetic_fixture(self):
        fixture_path = FIXTURES_DIR / "workflow_representative_synthetic.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        pass_findings = [f for f in findings if f.severity == Severity.PASS]
        pass_rules = {f.rule_name for f in pass_findings}

        # Motor 1: Higiene de credenciales PASS
        self.assertIn("Higiene de Credenciales y Secretos", pass_rules)

        # Motor 2: Modularidad y Resiliencia PASS
        self.assertIn("Regla de Modularidad", pass_rules)
        self.assertIn("Regla de Resiliencia", pass_rules)

        # Motor 3: Integridad de Grafo PASS
        self.assertIn("Integridad de Grafo y Control de Lotes", pass_rules)

        # Motor 4: Contexto de Prompt robusto PASS (>60 chars)
        self.assertIn("Estructura y Contexto del Prompt", pass_rules)

    # COV-03: Detección de secreto sintético mediante fixture específica
    def test_cov03_synthetic_secret_fixture_detection(self):
        fixture_path = FIXTURES_DIR / "workflow_with_secret.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        findings = N8nAuditOrchestrator(N8nWorkflowParser(workflow)).run_all_engines()
        critical_findings = [f for f in findings if f.severity == Severity.CRITICAL]
        rules = {f.rule_name for f in critical_findings}
        self.assertIn("Credenciales Hardcodeadas en Parámetros", rules)


if __name__ == "__main__":
    unittest.main()
