# Fixtures sintéticas de prueba — KevoLint (INC-01)

Este directorio contiene workflows en formato JSON de n8n para pruebas de regresión, contrato y límites de la API de KevoLint (`POST /api/v1/audits`).

Todos los archivos aquí incluidos son **100% sintéticos, deterministas y libres de secretos reales o datos privados de usuarios**.

---

## Inventario de archivos

### 1. `workflow_minimal.json`
- **Escenario asociado:** CL-03 (Prioridad P0).
- **Propósito:** Workflow de exactamente un único nodo trigger (`n8n-nodes-base.webhook`) sin conexiones.
- **Validación esperada:** 
  - Contrato HTTP: `200 OK`.
  - Motor de auditoría: `Trigger Sin Salida` (Regla de Integridad, Motor 3 - Lógica y Flujo de Datos).

### 2. `workflow_150_nodes.json`
- **Escenario asociado:** CL-04 (Prioridad P1), COV-02.
- **Propósito:** Workflow sintético con exactamente 150 nodos encadenados (`n8n-nodes-base.noOp`), que representa el límite superior estricto permitido por `MAX_NODES = 150`.
- **Validación esperada:**
  - Contrato HTTP: `200 OK`.
  - Motor de auditoría: Regla de Modularidad (> 20 nodos genera advertencia de complejidad arquitectónica).

### 3. `workflow_with_secret.json`
- **Escenario asociado:** CL-19 (parcial) / Motor 1 (Prioridad P0), COV-03.
- **Propósito:** Nodo `n8n-nodes-base.httpRequest` con cabecera `authorization` y valor simulado de formato Bearer.
- **Seguridad:** El valor `Bearer sk-SYNTHETIC_FAKE_TOKEN_NOT_A_REAL_SECRET_AAABBBCCC` es ficticio y fue diseñado únicamente para coincidir con la expresión regular de escaneo de `core.py`.
- **Validación esperada:**
  - Contrato HTTP: `200 OK`.
  - Hallazgo: `CRÍTICO` en Motor 1 ("Credenciales Hardcodeadas en Parámetros" y "Uso de Cabeceras Manuales sin Propiedad Credentials").

### 4. `workflow_representative_synthetic.json`
- **Escenario asociado:** CL-19 (Prioridad P0), COV-03, COV-04, COV-07.
- **Propósito:** Workflow compuesto de 9 nodos representativos (Webhook, If con ambas ramas conectadas, HTTP Request seguro con credenciales n8n, SplitInBatches, Set, NoOp de éxito/error, Agente IA con prompt estructurado y RespondToWebhook).
- **Estado de datos reales:** Sustituye provisionalmente a `workflow_real_sanitized.json` (cuya inclusión requiere aprobación formal AP-06).
- **Validación esperada:**
  - Contrato HTTP: `200 OK`.
  - Motor 1: `PASS` ("Higiene de Credenciales y Secretos").
  - Motor 2: `PASS` ("Regla de Modularidad" <= 20 nodos y "Regla de Resiliencia" por `settings.errorWorkflow`).
  - Motor 3: `PASS` ("Integridad de Grafo y Control de Lotes").
  - Motor 4: `PASS` ("Estructura y Contexto del Prompt" > 60 chars).
