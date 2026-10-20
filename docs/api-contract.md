# Contrato de API: `POST /api/v1/audits`

**Versión del API:** `0.1.0`  
**Estado:** INC-02 implementado y verificado localmente: 66 pruebas aprobadas (56 originales y 10 nuevas). Cambios sin commit ni publicación; CI Linux de INC-02 pendiente de autorización posterior. Baseline integrada: `1e9328813002098abf7b4ce5268d76e5f50b45ac`, con 56 pruebas y smoke Streamlit satisfactorios en [CI de INC-01](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39381690115). Esa ejecución no verifica los cambios locales de INC-02.
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
*(Nota: Las respuestas de error no garantizan necesariamente estas cabeceras específicas. Se distinguen tres categorías: (a) errores de validación controlados mediante `HTTPException` de FastAPI [400, 413, 415 y 422], incluidos DEF-01 y DEF-02 tras la corrección local INC-02; (b) excepciones durante `_audit_workflow`, convertidas a `HTTPException(500, detail="Error interno de auditoría.")`; y (c) otras excepciones no controladas fuera de ese bloque, que pueden derivar en HTTP 500 con texto plano `"Internal Server Error"` y sin dichas cabeceras garantizadas. INC-02 no añade un manejador universal de errores).*

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

*Nota de seguridad y alcance de HTTP 500:* El cuerpo JSON con detalle ofuscado (`{"detail": "Error interno de auditoría."}`) corresponde exclusivamente a excepciones capturadas internamente durante `_audit_workflow`. No garantiza formato JSON universal para cualquier excepción fuera de ese bloque, por ejemplo en middleware o código de validación no cubierto. Esas excepciones todavía pueden producir HTTP 500 en texto plano. Los casos concretos DEF-01 y DEF-02 ahora se rechazan localmente con HTTP 422 controlado; no se declaran publicados ni integrados hasta completar las autorizaciones y CI correspondientes.

---

## 6. DEF-01 y DEF-02 — Corrección local INC-02, pendiente de publicación

> [!CAUTION]
> Los defectos preexistentes causaban HTTP 500 para entradas que debían rechazarse con HTTP 422. INC-02 incorpora dos guardas mínimas, verificadas mediante 66 pruebas locales, sin modificar el contrato de entradas válidas.
> **HTTP 500 no es un resultado contractual válido para estos casos.** Las regresiones nuevas exigen HTTP 422, JSON controlado, ausencia de reflejo del payload y que el motor no se ejecute.
> El cambio sigue sin commit, push, PR o merge. CI Linux y publicación requieren autorización posterior. Véase [informe pre-commit](verification-inc02.md).

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
- **Causa histórica:** La pertenencia de una lista u objeto a `known_names` (`set[str]`) se evaluaba sin comprobar primero el tipo del destino. Producía `TypeError` fuera del bloque que captura errores del motor y HTTP 500 en texto plano. Se reprodujeron ambos tipos antes del arreglo.
- **Corrección INC-02:** Comprobar que la arista sea un objeto y su destino un string antes de consultar el conjunto. Los destinos conocidos siguen admitidos.
- **Resultado local verificado:** HTTP 422 con `{"detail": "connections contiene una conexión con destino inválido."}` para lista, objeto, null, entero, decimal, booleanos, string vacío y nombre desconocido. No se ejecuta el motor ni se refleja el contenido privado de prueba.
- **Estado:** Corregido y probado localmente; pendiente de autorización de commit/publicación y validación CI Linux.

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
- **Causa histórica:** `math.isfinite(10**400)` intentaba convertir el entero a float antes de comprobar su magnitud. Esa conversión producía `OverflowError` fuera del bloque de errores del motor. Se reprodujeron enteros extremos positivos y negativos en ambos ejes mediante cuerpos JSON HTTP reales.
- **Corrección INC-02:** Conservar las guardas de arreglo, longitud, tipo numérico y exclusión de booleanos; evaluar `abs(v) > 1e9` antes de `math.isfinite(v)`. Los enteros extremos se descartan por cortocircuito antes de la conversión insegura. NaN sigue rechazándose por finitud.
- **Resultado local verificado:** HTTP 422 con `{"detail": "nodes[0].position debe tener dos números finitos."}` para los casos inválidos del primer nodo. Las fronteras ±1e9, enteros admitidos y decimales finitos conservan HTTP 200 y su resultado completo.
- **Transporte probado:** Los enteros de 401 dígitos se enviaron como números JSON, no como `1e400`. También se rechazaron los lexemas JSON válidos `1e400`/`-1e400` y los tokens NaN/Infinity/-Infinity mediante bytes explícitos; estos últimos son extensiones aceptadas por `json.loads`, no JSON estándar. Las comprobaciones directas de estructuras Python se registran separadamente.
- **Estado:** Corregido y probado localmente; pendiente de autorización de commit/publicación y validación CI Linux.

---

*Documento mantenido por el equipo KevoLint. Última actualización local: INC-02 (2026-10-20), sin publicación.*
