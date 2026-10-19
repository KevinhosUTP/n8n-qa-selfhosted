# Contrato de API: `POST /api/v1/audits`

**Versión del API:** `0.1.0`  
**Estado:** Verificado localmente; CI Linux pendiente.  
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
*(Nota: Las respuestas de error 4xx o 5xx son generadas a través de `HTTPException` de Starlette/FastAPI y no garantizan necesariamente estas cabeceras específicas).*

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
| **`500 Internal Server Error`** | Error no controlado durante el procesamiento en el motor | `{"detail": "Error interno de auditoría."}` |

*Nota de seguridad:* Ante un fallo `500`, el detalle devuelto se encuentra ofuscado intencionalmente (`"Error interno de auditoría."`) para evitar la exposición accidental de estructuras o parámetros confidenciales del workflow.
