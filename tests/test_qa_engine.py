"""Regression smoke tests for the extracted n8n QA engine (stdlib unittest)."""
import json
import unittest

from packages.qa_engine import (
    N8nWorkflowParser,
    N8nAuditOrchestrator,
    WorkflowAutoRemediator,
    WorkflowMetrics,
    Severity,
)


class EngineSmokeTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
