"""Regression smoke and engine contract tests for the extracted n8n QA engine.

Preserva íntegras las 6 pruebas base originales e incorpora los escenarios
CL-17, CL-18 y validación completa de los cuatro motores (COV-03 y COV-04),
más las correcciones AUD11-03, AUD11-04, AUD11-05 del incremento INC-01-R1.
"""
import copy
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

    # -------------------------------------------------------------------------
    # INC-01-R1: CORRECCIONES AUD11-03, AUD11-04, AUD11-05
    # -------------------------------------------------------------------------

    # AUD11-03: Motor de arquitectura — aserciones explícitas de WARNING con severity
    def test_aud11_03a_architecture_modularidad_warning_with_150_nodes(self):
        """AUD11-03: Motor 2 emite WARNING de Modularidad con severity explícita.

        Usa el fixture workflow_150_nodes.json (150 nodos > umbral 20).
        Verifica rule_name exacto, severity=WARNING y node_count en mensaje.
        """
        fixture_path = FIXTURES_DIR / "workflow_150_nodes.json"
        with open(fixture_path, "r", encoding="utf-8") as f:
            wf = json.load(f)

        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        arch = [f for f in findings if f.engine == EngineCategory.ARCHITECTURE]

        modularidad = [
            f for f in arch
            if f.rule_name == "Regla de Modularidad (Complejidad Monolítica)"
        ]
        self.assertTrue(modularidad, "Se esperaba hallazgo de Modularidad con 150 nodos")
        self.assertEqual(modularidad[0].severity, Severity.WARNING)
        self.assertIn("150", modularidad[0].message)
        self.assertIn("node_name", vars(modularidad[0]))
        self.assertEqual(modularidad[0].node_name, "Global")

    def test_aud11_03b_architecture_resiliencia_warning_without_error_handler(self):
        """AUD11-03: Motor 2 emite WARNING de Resiliencia cuando no hay errorWorkflow.

        Usa un workflow mínimo sin settings.errorWorkflow ni nodo errorTrigger.
        Verifica rule_name exacto, severity=WARNING y node_type esperado.
        """
        wf = {
            "name": "Sin manejador de errores",
            "nodes": [
                {
                    "name": "Trigger",
                    "type": "n8n-nodes-base.webhook",
                    "position": [0, 0],
                    "parameters": {},
                }
            ],
            "connections": {},
            # Sin settings.errorWorkflow y sin nodo errorTrigger
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        arch = [f for f in findings if f.engine == EngineCategory.ARCHITECTURE]

        resiliencia = [
            f for f in arch
            if "Sin Manejador Global de Errores" in f.rule_name
        ]
        self.assertTrue(resiliencia, "Se esperaba WARNING de Resiliencia sin errorWorkflow")
        self.assertEqual(resiliencia[0].severity, Severity.WARNING)
        self.assertEqual(resiliencia[0].node_type, "n8n-nodes-base.errorTrigger")

    def test_aud11_03c_architecture_resiliencia_pass_with_error_workflow_setting(self):
        """AUD11-03 complementario: PASS de Resiliencia cuando settings.errorWorkflow existe."""
        wf = {
            "name": "Con manejador de errores",
            "nodes": [
                {
                    "name": "Trigger",
                    "type": "n8n-nodes-base.webhook",
                    "position": [0, 0],
                    "parameters": {},
                }
            ],
            "connections": {},
            "settings": {"errorWorkflow": "error-handler-id"},
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        arch = [f for f in findings if f.engine == EngineCategory.ARCHITECTURE]

        resiliencia_pass = [
            f for f in arch
            if f.rule_name == "Regla de Resiliencia" and f.severity == Severity.PASS
        ]
        self.assertTrue(resiliencia_pass, "Se esperaba PASS de Resiliencia con settings.errorWorkflow")

    # AUD11-04: Switch fallback — tres escenarios discriminantes
    def test_aud11_04a_switch_no_fallback_all_outputs_connected_no_finding(self):
        """AUD11-04 escenario 1: Switch sin fallback, todas las salidas conectadas → sin finding."""
        wf = {
            "name": "Switch completo sin fallback",
            "nodes": [
                {
                    "name": "Switch",
                    "type": "n8n-nodes-base.switch",
                    "position": [0, 0],
                    "parameters": {
                        "rules": {"values": [{"v": "1"}]},
                        # Sin fallbackOutput configurado
                    },
                },
                {"name": "Out0", "type": "n8n-nodes-base.noOp", "position": [200, 0], "parameters": {}},
            ],
            "connections": {
                "Switch": {
                    "main": [
                        [{"node": "Out0", "type": "main", "index": 0}],  # Salida regla 0: conectada
                    ]
                }
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        switch_findings = [f for f in findings if "Ruta Muerta en Nodo Switch" in f.rule_name]
        self.assertEqual(
            len(switch_findings), 0,
            "Switch con 1 regla, sin fallback y salida conectada no debe generar finding."
        )

    def test_aud11_04b_switch_with_fallback_configured_but_output_missing_generates_warning(self):
        """AUD11-04 escenario 2: fallbackOutput configurado, salida fallback sin conectar → WARNING.

        Solo existe la salida ordinaria de regla (índice 0) conectada en connections.main.
        No existe la rama [ ] del fallback en connections.main.
        La advertencia depende exclusivamente de la salida adicional esperada por fallbackOutput.
        """
        wf = {
            "name": "Switch fallback desconectado",
            "nodes": [
                {
                    "name": "Switch",
                    "type": "n8n-nodes-base.switch",
                    "position": [0, 0],
                    "parameters": {
                        "rules": {"values": [{"v": "1"}]},
                        "options": {"fallbackOutput": "extra"},
                    },
                },
                {"name": "Out0", "type": "n8n-nodes-base.noOp", "position": [200, 0], "parameters": {}},
            ],
            "connections": {
                "Switch": {
                    "main": [
                        [{"node": "Out0", "type": "main", "index": 0}],
                        # OJO: NO hay una segunda rama [] en connections.main.
                        # Solo la salida ordinaria existe en connections.
                    ]
                }
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        switch_findings = [f for f in findings if "Ruta Muerta en Nodo Switch" in f.rule_name]
        self.assertTrue(
            switch_findings,
            "Switch con fallbackOutput configurado pero salida adicional faltante debe generar WARNING."
        )
        finding = switch_findings[0]
        self.assertEqual(finding.rule_name, "Regla de Integridad (Ruta Muerta en Nodo Switch)")
        self.assertEqual(finding.engine, EngineCategory.DATA_LOGIC)
        self.assertEqual(finding.severity, Severity.WARNING)
        self.assertEqual(finding.node_name, "Switch")
        self.assertIn("[1]", finding.message, "El mensaje debe indicar el índice faltante [1].")

        # Verificación estricta de sensibilidad: si fallbackOutput es 'none', el warning debe desaparecer
        wf_sim = copy.deepcopy(wf)
        wf_sim["nodes"][0]["parameters"]["options"]["fallbackOutput"] = "none"
        findings_sim = N8nAuditOrchestrator(N8nWorkflowParser(wf_sim)).run_all_engines()
        sw_sim = [f for f in findings_sim if "Ruta Muerta en Nodo Switch" in f.rule_name]
        self.assertEqual(
            len(sw_sim), 0,
            "Sensibilidad verificada: al desactivar fallbackOutput no debe haber advertencia de switch."
        )

    def test_aud11_04c_switch_with_fallback_all_outputs_connected_no_finding(self):
        """AUD11-04 escenario 3: fallbackOutput configurado y AMBAS salidas conectadas → sin finding."""
        wf = {
            "name": "Switch fallback conectado",
            "nodes": [
                {
                    "name": "Switch",
                    "type": "n8n-nodes-base.switch",
                    "position": [0, 0],
                    "parameters": {
                        "rules": {"values": [{"v": "1"}]},
                        "options": {"fallbackOutput": "extra"},
                    },
                },
                {"name": "Out0", "type": "n8n-nodes-base.noOp", "position": [200, 0], "parameters": {}},
                {"name": "Fallback", "type": "n8n-nodes-base.noOp", "position": [200, 100], "parameters": {}},
            ],
            "connections": {
                "Switch": {
                    "main": [
                        [{"node": "Out0", "type": "main", "index": 0}],      # Salida regla 0: conectada
                        [{"node": "Fallback", "type": "main", "index": 0}],  # Salida fallback: conectada
                    ]
                }
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        switch_findings = [f for f in findings if "Ruta Muerta en Nodo Switch" in f.rule_name]
        self.assertEqual(
            len(switch_findings), 0,
            "Switch con fallbackOutput y AMBAS salidas conectadas no debe generar finding."
        )

    # AUD11-05: OOM — discriminación exacta por profundidad de hop (depth 1, 2, 3)
    def test_aud11_05a_oom_no_warning_when_split_at_hop_distance_1(self):
        """AUD11-05: Source → splitInBatches (hop 1, dentro de max_depth=2) → sin OOM."""
        wf = {
            "name": "OOM depth 1",
            "nodes": [
                {
                    "name": "Source",
                    "type": "n8n-nodes-base.httpRequest",
                    "position": [0, 0],
                    "parameters": {"operation": "getAll"},
                },
                {
                    "name": "Split",
                    "type": "n8n-nodes-base.splitInBatches",
                    "position": [200, 0],
                    "parameters": {"batchSize": 10},
                },
            ],
            "connections": {
                "Source": {"main": [[{"node": "Split", "type": "main", "index": 0}]]}
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        oom = [f for f in findings if "Riesgo OOM" in f.rule_name]
        self.assertEqual(len(oom), 0, "Con splitInBatches a hop 1 no debe haber advertencia de OOM.")

    def test_aud11_05b_oom_no_warning_when_split_at_hop_distance_2(self):
        """AUD11-05: Source → Intermediate → splitInBatches (hop 2) → sin OOM."""
        wf = {
            "name": "OOM depth 2",
            "nodes": [
                {
                    "name": "Source",
                    "type": "n8n-nodes-base.httpRequest",
                    "position": [0, 0],
                    "parameters": {"operation": "getAll"},
                },
                {
                    "name": "Middle",
                    "type": "n8n-nodes-base.set",
                    "position": [200, 0],
                    "parameters": {},
                },
                {
                    "name": "Split",
                    "type": "n8n-nodes-base.splitInBatches",
                    "position": [400, 0],
                    "parameters": {"batchSize": 10},
                },
            ],
            "connections": {
                "Source": {"main": [[{"node": "Middle", "type": "main", "index": 0}]]},
                "Middle": {"main": [[{"node": "Split", "type": "main", "index": 0}]]},
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        oom = [f for f in findings if "Riesgo OOM" in f.rule_name]
        self.assertEqual(len(oom), 0, "Con splitInBatches a hop 2 no debe haber advertencia de OOM.")

    def test_aud11_05c_oom_warning_when_split_at_hop_distance_3(self):
        """AUD11-05 (regresión crítica): Source → Mid1 → Mid2 → Split (hop 3 > max_depth=2) → OOM WARNING.

        get_downstream_nodes(max_depth=2) no alcanza nodos a distancia 3.
        Por tanto el motor no encuentra splitInBatches y emite OOM WARNING en Source.
        Este test verifica el comportamiento REAL del motor — no presupone su corrección.
        """
        wf = {
            "name": "OOM depth 3",
            "nodes": [
                {
                    "name": "Source",
                    "type": "n8n-nodes-base.httpRequest",
                    "position": [0, 0],
                    "parameters": {"operation": "getAll"},
                },
                {
                    "name": "Mid1",
                    "type": "n8n-nodes-base.set",
                    "position": [200, 0],
                    "parameters": {},
                },
                {
                    "name": "Mid2",
                    "type": "n8n-nodes-base.set",
                    "position": [400, 0],
                    "parameters": {},
                },
                {
                    "name": "Split",
                    "type": "n8n-nodes-base.splitInBatches",
                    "position": [600, 0],
                    "parameters": {"batchSize": 10},
                },
            ],
            "connections": {
                "Source": {"main": [[{"node": "Mid1", "type": "main", "index": 0}]]},
                "Mid1": {"main": [[{"node": "Mid2", "type": "main", "index": 0}]]},
                "Mid2": {"main": [[{"node": "Split", "type": "main", "index": 0}]]},
            },
        }
        findings = N8nAuditOrchestrator(N8nWorkflowParser(wf)).run_all_engines()
        oom = [f for f in findings if "Riesgo OOM" in f.rule_name]
        self.assertTrue(
            oom,
            "Con splitInBatches a hop 3 (fuera de max_depth=2), Source debe emitir OOM WARNING."
        )
        self.assertEqual(oom[0].severity, Severity.WARNING)
        self.assertEqual(oom[0].node_name, "Source")
        self.assertEqual(oom[0].engine, EngineCategory.DATA_LOGIC)


if __name__ == "__main__":
    unittest.main()
