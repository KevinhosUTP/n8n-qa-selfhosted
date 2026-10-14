"""HTTP contract and adversarial input tests for the FastAPI MVP."""
import unittest

from fastapi.testclient import TestClient

from apps.api.main import app, MAX_NODES

client = TestClient(app)
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


if __name__ == "__main__":
    unittest.main()
