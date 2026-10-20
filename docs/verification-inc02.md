# KEVOLINT — INC-02 · INFORME DE IMPLEMENTACIÓN Y VALIDACIÓN PRE-COMMIT

Fecha: 20/10/2026. Estado: **LISTO PARA COMMIT**, sujeto a autorización posterior.

Este informe acredita cambios locales sin staging, commit, push, PR, merge ni despliegue. No acredita CI Linux de INC-02 ni autoriza su publicación. Alcance exclusivo: DEF-01 y DEF-02; sin autenticación, rate limiting ni refactorizaciones adicionales.

## 1. Rama de implementación

`codex/kevolint-inc02-input-hardening`, creada localmente desde el commit remoto autorizado. No se implementó sobre `antigravity/api-contract-tests`.

## 2. HEAD base verificado

`1e9328813002098abf7b4ce5268d76e5f50b45ac`.

Se consultó `git ls-remote --heads origin refs/heads/develop refs/heads/codex/kevolint-inc02-input-hardening`: develop coincidía exactamente y la rama propuesta no existía en el remoto. Tampoco existía localmente. Se descargó develop y se creó la rama nueva desde ese SHA. No se modificaron las ramas locales develop/main ni se publicó ninguna referencia.

El HEAD continúa en la base: todavía no existe un commit de INC-02.

## 3. Estado inicial del repositorio

La copia local estaba en `antigravity/api-contract-tests`, HEAD `32516fbcc6f4676106c8e863b3badaa37af5fe7f`, sin cambios versionados. Su árbol coincidía con el squash remoto de INC-01. Solo permanecía `?? docs/coordination/`, fuera de alcance.

Se revisaron las restricciones y los documentos SEC, se confirmó INC-01 integrado y se ejecutó la suite original: **56 pruebas, OK, código 0**. Se reprodujeron HTTP 500 antes del arreglo para los dos destinos no hashables y los cuatro enteros extremos por signo/eje. No se encontró AGENTS.md aplicable en la búsqueda realizada.

## 4. Causas raíz

- **DEF-01:** la consulta `edge.get("node") not in known_names` aplicaba hashing a listas/objetos antes de validar su tipo. Causaba TypeError en `_validate_workflow`, fuera del bloque de errores del motor.
- **DEF-02:** `math.isfinite(v)` convertía enteros extremos a float antes de comprobar su magnitud. Causaba OverflowError para enteros de 401 dígitos, también fuera de ese bloque.

Los seis casos HTTP producían 500 y `Internal Server Error` en texto plano. Son defectos, no respuestas contractuales admitidas.

## 5. Modificaciones exactas y referencias

Referencias correspondientes a los archivos locales de esta entrega:

- `apps/api/main.py:100`: comprobar `abs(v) > 1e9` antes de `not math.isfinite(v)`. Se conservan tipo, exclusión de booleanos, arreglo y longitud; el cortocircuito descarta enteros extremos sin conversión a float.
- `apps/api/main.py:121–123`: comprobar objeto de arista y destino string antes de consultar el conjunto de nombres. Se conserva el rechazo de nombres inexistentes.
- `tests/test_api.py:883`: clase nueva `Inc02InputValidationTests`; tests HTTP, pruebas Python directas y helpers independientes de las pruebas anteriores.
- `docs/api-contract.md:4` y sección 6: estado local real, antecedentes, correcciones y limitaciones de errores/CI.

El diff de producción contiene exclusivamente las dos guardas; no cambia funciones, endpoints ni motores adicionales.

## 6. Archivos modificados y creados

Modificados:

1. `apps/api/main.py`.
2. `tests/test_api.py`.
3. `docs/api-contract.md`.

Creado:

4. `docs/verification-inc02.md`.

No hay scripts temporales versionados ni cambios en otros archivos del repositorio.

## 7. Matriz DEF-01

Todos los rechazos HTTP se envían como bytes JSON al endpoint real mediante TestClient, con `raise_server_exceptions=False` para observar el estado HTTP en lugar de confundir una excepción relanzada por el cliente con una aserción.

| Destino | Resultado local | Comprobaciones adicionales |
| --- | --- | --- |
| `[]` | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| `{}` | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| `null` | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| Entero `7` | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| Decimal `0.5` | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| `true` / `false` | 422 JSON, dos casos | Motor no invocado; detalle constante; sin marcador privado |
| String vacío | 422 JSON | Motor no invocado; detalle constante; sin marcador privado |
| Nombre desconocido | 422 JSON | El propio nombre privado no aparece en la respuesta |
| Nombre existente `End` | 200 | Motor real una vez, respuesta completa y cabeceras conservadas |

Detalle exigido: `connections contiene una conexión con destino inválido.` La respuesta debe ser exactamente un objeto con `detail`, y Content-Type application/json. El marcador privado está presente en nombre y parámetros del workflow de cada caso inválido; no se imprime ni refleja.

## 8. Matriz DEF-02

| Position / familia | Resultado local | Cobertura |
| --- | --- | --- |
| `[10**400, 0]` | 422 | Entero JSON de 401 dígitos |
| `[-(10**400), 0]` | 422 | Entero negativo JSON |
| `[0, 10**400]` | 422 | Segundo eje |
| `[0, -(10**400)]` | 422 | Segundo eje y signo negativo |
| `[true, 0]` | 422 | También false y ambos ejes |
| `[null, 0]` | 422 | Ambos ejes |
| `[0, "10"]` | 422 | Ambos ejes; también listas y objetos como coordenadas |
| `[1e9 + 1, 0]` | 422 | Enteros y decimales fuera del rango, ambos ejes |
| `[-1e9 - 1, 0]` | 422 | Ambos signos y ejes |
| `[1e9, -1e9]` | 200 | Tanto fronteras int como float |
| `[-1e9, 1e9]` | 200 | Tanto fronteras int como float |
| `[0, 0]` | 200 | Tipo e interpretación conservados |
| `[0.5, -0.5]` | 200 | Tipo e interpretación conservados |
| Position null, objeto, string, número, `[]`, `[0]`, `[0,0,0]` | 422 | Siete formas inválidas |
| NaN, Infinity, -Infinity | 422 | Bytes HTTP explícitos, ambos ejes |
| `1e400`, `-1e400` | 422 | Lexemas JSON válidos que Python convierte a infinitos, ambos ejes |

Detalle exigido para el primer nodo: `nodes[0].position debe tener dos números finitos.` Todos los rechazos verifican Content-Type, objeto JSON exacto, motor no invocado y ausencia de reflejo del marcador privado.

NaN/Infinity/-Infinity son extensiones del parser Python, no números JSON estándar. Se envían con `content=` y bytes construidos expresamente; no se usa `json=` de HTTPX, que los rechazaría antes del servidor. Los enteros extremos se envían como enteros, nunca sustituidos por notación científica.

Separadamente se comprueban siete estructuras Python directas: dos destinos no hashables y cinco coordenadas (dos enteros extremos, NaN y los dos infinitos). Deben lanzar HTTPException 422 con el detalle exacto, no TypeError/OverflowError. No se presentan como pruebas HTTP.

## 9. Comparación antes/después

| Comprobación | Original | INC-02 local |
| --- | --- | --- |
| Destinos lista/objeto, dos casos | TypeError y HTTP 500 | HTTP 422 controlado |
| Enteros extremos, cuatro signos/ejes | OverflowError y HTTP 500 | HTTP 422 controlado |
| Resto de entradas inválidas cubiertas | Rechazo existente | Rechazo conservado |
| Workflow válido y posiciones admitidas | HTTP 200 | HTTP 200 y respuesta completa conservada |

Se añadieron primero los tests y se ejecutaron antes de corregir producción: 10 tests, seis fallos HTTP `500 != 422` y cuatro errores esperados de producción en las pruebas Python directas. No hubo un cambio del harness para conseguir un verde artificial.

Tras DEF-01 se ejecutaron sus dos tests, ambos OK; tras DEF-02 pasaron los diez tests nuevos.

También se comparó el validador original obtenido de Git con el corregido en el mismo proceso: **24 pares HTTP válidos equivalentes**, correspondientes a cuatro workflows (baseline, mínimo, representativo sintético y 150 nodos) y seis posiciones. Se compararon el JSON completo y las cabeceras no-store/nosniff, sin modificar archivos ni el motor. Todos fueron HTTP 200.

## 10. Pruebas originales preservadas

**56/56 originales conservadas y aprobadas.** Los 37 métodos anteriores de tests API conservan exactamente su AST; el archivo de los 19 tests del motor conserva sus bytes. No se eliminaron tests ni se debilitaron aserciones.

Las regresiones de límites, Content-Length, streaming, sanitización y concurrencia INC-01-R3 siguen aprobadas.

## 11. Pruebas nuevas

Diez métodos nuevos en `Inc02InputValidationTests`, que ejercitan 64 casos: **57 HTTP y siete Python directos**. Los casos parametrizados se implementan con subTest; no se suman artificialmente al total de tests descubierto por unittest.

- DEF-01: rechazos HTTP y aceptación del destino existente.
- DEF-02: enteros extremos, tipos/booleanos, formas, límites, fronteras válidas, extensiones no finitas y overflow científico.
- Validación Python directa de excepciones controladas.

Las pruebas válidas envuelven el motor real con `wraps`, comprueban una invocación, preservación de valores/tipos y respuesta completa. Las inválidas comprueban expresamente que no se invoca.

## 12. Suite oficial ejecutada

Desde la raíz, sin modificar variables de entorno ni instalar paquetes:

```powershell
& ".\.venv\Scripts\python.exe" -B -m unittest discover -s tests -v
```

Resultado real: **Ran 66 tests in 0.460s — OK — exit 0**. Son 56 pruebas originales y diez nuevas; cero fallos y cero errores en la ejecución final.

Se utilizó el entorno Python existente. Se mantiene una advertencia de deprecación Starlette/TestClient/httpx preexistente; no se actualizaron dependencias para eliminarla.

## 13. Smoke Streamlit

```powershell
& ".\.venv\Scripts\python.exe" -B scripts/smoke_streamlit.py
```

Resultado: **Legacy Streamlit initial-screen smoke test passed**, código 0. Aparece el warning conocido de ScriptRunContext en modo de prueba. No se prueban aquí las interacciones de carga de archivos de Streamlit.

## 14. Revisión de diff y alcance

`git diff --check`: satisfactorio, código 0, sin errores de whitespace. Se revisan también el archivo nuevo sin staging, el diff completo, stat, name-only y status antes de entregar.

La comparación SHA-256 de los 399 archivos versionados de la baseline detecta exclusivamente los tres archivos modificados autorizados: los **396 restantes permanecen idénticos en bytes**. El cuarto archivo autorizado es el informe nuevo sin seguimiento. Los avisos Git de conversión futura LF/CRLF no son fallos de whitespace ni justifican cambios globales de configuración.

El índice permanece sin cambios. `git diff --stat` y `git diff --name-only` no incluyen el informe untracked; por ello se comprueba también `git status --short` y su contenido por separado, sin git add.

## 15. Pruebas adversariales en memoria

Se reintrodujo cada defecto por separado en una función compilada en memoria y se parcheó temporalmente `_validate_workflow` mediante `unittest.mock.patch`, con restauración automática. No se crearon scripts ni se modificó producción en disco para estas sondas.

| Mutación | Regresión ejecutada | Detección real |
| --- | --- | --- |
| Retirar la guarda de tipo del destino | Rechazos HTTP DEF-01 | Dos fallos de aserción `500 != 422`, cero errores del harness |
| Volver a comprobar finitud antes de magnitud | Enteros extremos HTTP DEF-02 | Cuatro fallos de aserción `500 != 422`, cero errores del harness |

Tras cada mutación se verificó la identidad de la función restaurada. Después se ejecutaron nuevamente los diez tests INC-02: todos OK. Las sondas no se cuentan como tests permanentes adicionales.

## 16. Impacto sobre el contrato API

Único cambio observable previsto: estas entradas inválidas pasan de HTTP 500 no controlado a HTTP 422 con detalle constante y sin ejecutar el motor.

Sin cambios en endpoints, versión API, `engine_version`, metrics/findings, enumeraciones, reglas/orden de los cuatro motores, límites 1 MiB/150 nodos/2.000 conexiones/profundidad 32/30.000 elementos, Content-Length o streaming. Las 24 comparaciones de válidos y la suite original sustentan la preservación, sin afirmar equivalencia para todas las entradas posibles.

No se añade un manejador universal de errores: otras excepciones fuera de `_audit_workflow` aún pueden devolver HTTP 500 en texto plano. Las cabeceras de éxito no se prometen como garantía universal en errores.

## 17. Dependencias y seguridad

Sin cambios en `apps/web/`, dependencias Python, package.json/lockfile, motor QA, SVG, tokens, fuentes, scripts SEC, políticas o workflows. No se instalaron paquetes, se leyeron valores secretos ni se modificaron variables de entorno.

SEC-PR01-01 permanece **aceptada temporalmente, no corregida**, con las mismas condiciones y vencimiento **31/10/2026 23:59:00 America/Lima — 01/11/2026 04:59:00 UTC**. INC-02 no la remedia, amplía ni renueva. No se inicia Clerk, axe, AP-06, PR06 ni otros incrementos.

## 18. Directorio docs/coordination/

Permanece untracked y fuera de alcance. Se contrastó su inventario y SHA-256 antes/después: el único archivo existente conserva sus bytes. No se agregó a Git, modificó, eliminó, movió ni sobrescribió.

## 19. Riesgos, limitaciones y estado CI

- **CI INC-02: no ejecutado.** No hay commit, push ni PR y no se atribuye un CI histórico a estos cambios.
- La [baseline integrada INC-01](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39381690115) acredita 56 pruebas y Streamlit, no INC-02.
- Validación actual local Windows, sin prueba nueva en Linux ni endpoint desplegado.
- La API sigue sin autenticación ni rate limiting; no se autoriza exposición pública ni despliegue.
- SEC, AXE-PR05-01, pruebas manuales A11Y, AP-06 y decisiones de arquitectura siguen pendientes.
- No se repitieron navegador/build/audit/artefacto frontend: no hay cambios en frontend y no se amplía el alcance autorizado.
- La cobertura demuestra estos casos y preservaciones concretas; no certifica ausencia de todo defecto de validación.

## 20. Recomendación y condiciones de publicación

**Dictamen: LISTO PARA COMMIT.** Las guardas mínimas, los rechazos HTTP reales, la no ejecución del motor, las respuestas sanitizadas, las entradas válidas y la capacidad de detectar reintroducciones cuentan con evidencia local satisfactoria.

Detención obligatoria antes de git add/commit/push/PR. El usuario debe revisar este informe y autorizar separadamente la publicación. Después deberán ejecutarse CI Linux sobre el commit real, auditoría independiente y aprobación expresa de cualquier merge. No se prepara despliegue ni se continúa con D02/SEC-GATE/PR06.
