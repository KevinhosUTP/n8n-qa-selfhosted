# Contrato de API: `POST /api/v1/audits`

**Versión del API:** `0.1.0`  
**Estado:** Verificado localmente (56 pruebas aprobadas). Evidencia CI Linux previa confirmada en commit `58e0eddc989d2ac464d9a4e611f940eba717d53b` (INC-01-R1, check `unit`: success). Nueva validación CI Linux para INC-01-R3 pendiente tras publicación de commit.\
**Implementación:** `apps/api/main.py` y `packages/qa_engine/core.py`.  
**Nivel de servicio:** Síncrono, en memoria, stateless (sin sesiones ni persistencia en disco o base de datos).

> [!WARNING]
> **Ausencia actual de autenticación y rate limiting:**  
> La API no cuenta actualmente con autenticación (HTTP 401/403) ni límites de tasa de peticiones (HTTP 429). Es deliberadamente sin sesiones. No debe publicarse directamente a internet sin una capa perimetral que proporcione autenticación y mitigación de abuso.

---

## 1. Endpoint

```http
POST /api/v1/audits HTTP/1.1
Content-Type: application/json
Content-Length: <longitud_en_bytes>
```

---

## 2. Restricciones y límites de entrada

| Límite / Restricción | Valor máximo / Condición | Código de error | Detalle devuelto |
| :--- | :--- | :--- | :--- |
| **Cabecera `Content-Type`** | Debe ser estrictamente `application/json` (ignora directivas secundarias tras `;`) | `415 Unsupported Media Type` | `{"detail": "Content-Type debe ser application/json."}` |
| **Cabecera `Content-Length`** | Opcional en la implementación actual (si no se envía, asume `"0"`). Si está presente, debe ser un entero numérico válido. Si su valor declarado supera 1 MiB (`1_048_576` bytes), se rechaza de inmediato en cabecera. **Nota de implementación:** el valor declarado no se coteja contra la longitud real de bytes del cuerpo; el tamaño efectivo se controla durante la lectura por streaming. | `400 Bad Request` o `413 Payload Too Large` | `{"detail": "Content-Length inválido."}` o `{"detail": "El JSON excede 1 MiB."}` |
| **Tamaño efectivo de cuerpo** | `1_048_576` bytes (1 MiB exacto) acumulados durante la lectura por streaming | `413 Payload Too Large` | `{"detail": "El JSON excede 1 MiB."}` |
| **Sintaxis y codificación JSON** | Debe ser JSON sintácticamente válido para `json.loads()`. Se recomienda enfáticamente codificación UTF-8. | `400 Bad Request` | `{"detail": "El cuerpo no es JSON válido."}` |
| **Estructura raíz** | Objeto JSON con la clave `"workflow"` como **única** propiedad permitida | `422 Unprocessable Entity` | `{"detail": "El cuerpo debe contener únicamente el campo \"workflow\"."}` |
| **Tipo de `workflow`** | Objeto JSON (diccionario) | `422 Unprocessable Entity` | `{"detail": "workflow debe ser un objeto JSON."}` |
| **Profundidad de anidamiento** | Máximo `32` niveles de recorrido en profundidad | `422 Unprocessable Entity` | `{"detail": "El JSON supera el nivel máximo de anidamiento."}` |
| **Cantidad total de elementos JSON** | Máximo `30_000` elementos (acumulado de diccionarios, listas y valores escalares) | `422 Unprocessable Entity` | `{"detail": "El JSON contiene demasiados elementos."}` |
| **Conteo de nodos (`nodes`)** | Lista con mínimo 1 y máximo `150` objetos nodo | `422 Unprocessable Entity` | `{"detail": "nodes debe contener entre 1 y 150 nodos."}` |
| **Campo `name` (Workflow)** | String de hasta 200 caracteres (opcional, valor por defecto: `"Flujo sin nombre"`) | `422 Unprocessable Entity` | `{"detail": "name debe ser un texto de hasta 200 caracteres."}` |
| **Campo `settings`** | Objeto JSON opcional (valor por defecto: `{}`). Si está presente, debe ser un diccionario (no null ni tipos escalares). | `422 Unprocessable Entity` | `{"detail": "settings debe ser un objeto JSON."}` |
| **Nodos: `name` y `type`** | String no vacío de hasta 200 caracteres por cada nodo (obligatorios) | `422 Unprocessable Entity` | `{"detail": "nodes[i].<campo> es obligatorio (máximo 200 caracteres)."}` |
| **Unicidad de nodos** | Cada nodo en `nodes` debe poseer un `name` único dentro del flujo | `422 Unprocessable Entity` | `{"detail": "Los nombres de los nodos deben ser únicos."}` |
| **Nodos: `parameters`** | Objeto JSON opcional (valor por defecto: `{}`). Si está presente, debe ser un diccionario. | `422 Unprocessable Entity` | `{"detail": "nodes[i].parameters debe ser un objeto."}` |
| **Nodos: `credentials`** | Objeto JSON opcional (valor por defecto: `{}`). Si está presente, debe ser un diccionario. | `422 Unprocessable Entity` | `{"detail": "nodes[i].credentials debe ser un objeto."}` |
| **Nodos: `position`** | Array opcional de 2 números finitos (enteros o floats, `|v| <= 1e9`), sin booleanos (valor por defecto: `[0, 0]`) | `422 Unprocessable Entity` | `{"detail": "nodes[i].position debe tener dos números finitos."}` |
| **Conexiones (`connections`)** | Objeto JSON opcional (valor por defecto: `{}`). Si está presente, debe referenciar exclusivamente nodos existentes. | `422 Unprocessable Entity` | `{"detail": "connections contiene un nodo origen desconocido o puertos inválidos."}` |
| **Límite de conexiones** | Máximo `2_000` aristas acumuladas en total en las ramas de puertos | `422 Unprocessable Entity` | `{"detail": "El workflow supera 2000 conexiones."}` |

---

## 3. Ejemplo mínimo de solicitud (`POST /api/v1/audits`)

```json
{
  "workflow": {
    "name": "Webhook minimo",
    "nodes": [
      {
        "name": "Trigger",
        "type": "n8n-nodes-base.webhook"
      }
    ]
  }
}
```

*Nota:* Al omitir `parameters`, `credentials`, `position`, `settings` y `connections`, la validación de FastAPI aplica sus valores por defecto seguros (`{}`, `{}`, `[0, 0]`, `{}` y `{}`).

---

## 4. Estructura de Respuesta Exitosa (`200 OK`)

### Cabeceras HTTP garantizadas
Las siguientes cabeceras de seguridad se garantizan explícitamente en la respuesta exitosa (`200 OK` emitida por `JSONResponse`):
```http
Cache-Control: no-store
X-Content-Type-Options: nosniff
Content-Type: application/json
```
*(Nota: Las respuestas de error no garantizan necesariamente estas cabeceras específicas. En la implementación actual, se distinguen tres categorías: (a) errores de validación de entrada controlados mediante `HTTPException` de FastAPI [códigos 400, 413, 415 y 422]; (b) errores no controlados capturados durante la ejecución del motor `_audit_workflow`, convertidos a `HTTPException(500, detail="Error interno de auditoría.")`; y (c) excepciones no controladas originadas fuera de dicho bloque [como los defectos DEF-01 y DEF-02 en `_validate_workflow`], las cuales derivan en un `HTTP 500` emitido por el manejador por defecto de Starlette con cuerpo de texto plano `"Internal Server Error"` y sin cabeceras de seguridad garantizadas).*

### Esquema del Cuerpo JSON
```json
{
  "engine_version": "static-v1",
  "metrics": {
    "workflow_name": "string",
    "total_nodes": "integer",
    "total_connections": "integer",
    "critical_count": "integer",
    "warning_count": "integer",
    "pass_count": "integer"
  },
  "findings": [
    {
      "engine": "1. Ciberseguridad e Integraciones | 2. Arquitectura y Escalabilidad | 3. Lógica y Flujo de Datos | 4. Prompt Engineering (Agentes IA)",
      "severity": "CRÍTICO | ADVERTENCIA | OK",
      "rule_name": "string",
      "node_name": "string",
      "node_type": "string",
      "message": "string",
      "recommendation": "string"
    }
  ]
}
```

### Precisiones sobre las Métricas devueltas
- `total_nodes`: Conteo de nodos ejecutables. **Excluye explícitamente las notas adhesivas** (`n8n-nodes-base.stickyNote`).
- `total_connections`: Conteo total de aristas destino registradas en los arreglos de conexiones.
- `critical_count`: Cantidad de hallazgos devueltos con severidad `"CRÍTICO"`.
- `warning_count`: Cantidad de hallazgos devueltos con severidad `"ADVERTENCIA"`.
- `pass_count`: Cantidad de comprobaciones devueltas con severidad `"OK"` correspondientes a reglas evaluadas sin incidencias.

---

## 5. Respuestas de Error

| Código | Causa principal | Formato del cuerpo |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Cuerpo malformado no parseable o cabecera `Content-Length` inválida | `{"detail": "string"}` |
| **`413 Payload Too Large`** | Cuerpo serializado o cabecera declarada mayor a 1 MiB (`1_048_576` bytes) | `{"detail": "El JSON excede 1 MiB."}` |
| **`415 Unsupported Media Type`** | `Content-Type` diferente a `application/json` | `{"detail": "Content-Type debe ser application/json."}` |
| **`422 Unprocessable Entity`** | Violación de restricciones de negocio, tipos o límites de esquema | `{"detail": "string"}` |
| **`500 Internal Server Error`** | Error no controlado capturado durante la ejecución de `_audit_workflow` | `{"detail": "Error interno de auditoría."}` |

*Nota de seguridad y alcance de HTTP 500:* El cuerpo JSON con detalle ofuscado (`{"detail": "Error interno de auditoría."}`) corresponde exclusivamente a excepciones capturadas internamente durante la ejecución del motor de auditoría (`_audit_workflow`), con el objetivo de evitar la exposición accidental de estructuras o parámetros confidenciales del workflow. No debe interpretarse como una garantía de formato JSON universal para cualquier excepción no controlada que ocurra fuera de dicho bloque (por ejemplo, excepciones durante `_validate_workflow` o middlewares), donde una configuración FastAPI/Starlette predeterminada puede responder con un error `500 Internal Server Error` en texto plano sin estructura JSON garantizada.

---

## 6. Defectos Productivos Conocidos (Pendientes de Corrección)

> [!CAUTION]
> Los siguientes defectos preexistentes en `apps/api/main.py` fueron identificados durante la auditoría independiente externa (Codex, octubre 2026). Provocan excepciones no controladas en tiempo de ejecución que derivan en respuestas `HTTP 500` para entradas que deberían ser validadas y rechazadas con `HTTP 422` en `_validate_workflow`.
> **No forman parte del contrato formal de la API y no deben introducirse pruebas que acepten HTTP 500 como comportamiento contractual válido.**
> La subsanación de ambos defectos queda registrada como pendiente de un incremento correctivo independiente, todavía sin numeración.

### DEF-01 — Destino de conexión no hashable (`{"node": []}`)

- **Ubicación:** `_validate_workflow` en `apps/api/main.py` (validación de aristas en `connections`).
- **Reproducción mínima:**
  ```json
  {
    "workflow": {
      "name": "Bug",
      "nodes": [{"name": "A", "type": "n8n-nodes-base.noOp", "position": [0, 0]}],
      "connections": {
        "A": {"main": [[{"node": [], "type": "main", "index": 0}]]}
      }
    }
  }
  ```
- **Mecanismo del fallo:** En `_validate_workflow`, la variable `known_names` está definida como un conjunto (`set[str]`). La comprobación `edge.get("node") not in known_names` evalúa la pertenencia de un objeto de tipo `list` dentro de un `set`. Dado que las listas en Python no son hashables, el intérprete genera inmediatamente `TypeError: unhashable type: 'list'`. La excepción se produce en `_validate_workflow`, fuera del bloque `try/except` que captura errores durante `_audit_workflow`. En una configuración FastAPI/Starlette predeterminada, esto deriva en una respuesta `HTTP 500` con cuerpo plano `"Internal Server Error"`, sin estructura JSON garantizada. Este comportamiento actual es un defecto no controlado y no debe considerarse contractual.
- **Comportamiento esperado según contrato:** Debe retornar `HTTP 422 Unprocessable Entity` indicando destino de conexión inválido.
- **Resolución prevista:** Pendiente de un incremento correctivo independiente, todavía sin numeración.

### DEF-02 — Entero de magnitud extrema en `position` (`10**400`)

- **Ubicación:** `_validate_workflow` en `apps/api/main.py` (validación de coordenadas en `position`).
- **Descripción:** El caso corresponde a `10**400`, un entero de 401 dígitos serializado como valor numérico en JSON. El estándar JSON define números sin distinguir subtipos como enteros o punto flotante; sin embargo, `json.loads()` de Python puede interpretar la notación científica `1e400` como un valor de punto flotante (`inf`). Por tanto, la reproducción debe construir el cuerpo programáticamente mediante `10**400` como entero, sin emplear la notación científica `1e400`.
- **Reproducción programática mínima:**
  ```python
  import json

  huge_int = 10**400  # Entero de 401 dígitos
  payload = {
      "workflow": {
          "name": "Bug",
          "nodes": [{"name": "A", "type": "n8n-nodes-base.noOp", "position": [huge_int, 0]}],
          "connections": {},
      }
  }
  body = json.dumps(payload).encode("utf-8")
  ```
- **Mecanismo del fallo:** En Python, los enteros poseen precisión arbitraria y no tienen límite de tamaño por desbordamiento. Sin embargo, la función `math.isfinite(v)` requiere un argumento numérico de punto flotante de 64 bits (`float` IEEE 754, cuyo valor máximo representable es aproximadamente `1.79e308`). Al evaluar `math.isfinite(10**400)`, Python intenta convertir implícitamente el entero a float y genera `OverflowError: int too large to convert to float`. Este fallo ocurre en `_validate_workflow`, antes de evaluar la comprobación de magnitud `abs(v) > 1e9` y fuera del bloque `try/except` de `_audit_workflow`. La excepción no controlada deriva en `HTTP 500` (con cuerpo plano en FastAPI/Starlette estándar, sin estructura JSON garantizada). Este comportamiento actual no debe considerarse contractual.
- **Comportamiento esperado según contrato:** Debe retornar `HTTP 422 Unprocessable Entity` indicando que `position` debe tener números finitos dentro del rango permitido.
- **Resolución prevista:** Pendiente de un incremento correctivo independiente, todavía sin numeración.

---

*Documento mantenido por el equipo KevoLint. Última actualización: INC-01-R3 (2026-10-19).*
