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


if __name__ == "__main__":
    unittest.main()
