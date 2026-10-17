# KevoLint — Handoff técnico · Entrega 3C

Versión 1.0 ·17 de octubre de2026 · Preparado para revisión y aprobación. Documento de diseño e integración; no implementación.

Identidad oficial: R2/C3 — Lint Signature refinado + W3 — Core. Firma: by KevoSilva. Descriptor: Auditoría estática de workflows para n8n.

La Entrega 3B está aprobada por el usuario, quien realizó personalmente las pruebas en Figma Present de la marca y los recorridos revisados. Esta aprobación se registra como evidencia del usuario; no se presenta como una prueba del frontend real ni como una revisión manual exhaustiva de363 frames realizada en3C.

El paquete contiene el inventario completo, decisiones verificables, recursos originales y criterios de aceptación. Codex deberá contrastar el contrato real de la API antes de integrar cualquier comportamiento. Aprobar este handoff no equivale a autorizar cambios en el repositorio o un despliegue.

## 1. Alcance, fuentes y grado de certeza

Se creó únicamente la página independiente [08 — Handoff · KevoLint · Next.js](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-936) dentro del archivo existente. Las páginas 01–07, el sistema de marca aprobado, las pantallas y las interacciones anteriores se conservan. No se modificaron GitHub, Next.js, FastAPI, Supabase, Clerk, Sentry, Coolify, DNS, pagos ni portfolio.

Fuentes: [prototipo](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-2), [BrandLogo](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-753), [movimiento de marca](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=401-68), [brief funcional de Notion](https://app.notion.com/p/3fa47126f90c812c8116c9aea51584cc) y la aprobación actual del usuario. Las decisiones actuales de identidad y la evidencia del archivo prevalecen sobre el nombre provisional de secciones antiguas del brief. Los nombres internos heredados de variables o estilos «n8n QA» permanecen como identificadores históricos; no son copy de producto.

El equipo no tiene Figma Specs habilitado. No se crearon documentos nativos SPEC_BLOCK. La página nueva es un índice visual y de recursos; esta documentación exportable es la especificación técnica completa.

| Etiqueta | Significado y uso |
| --- | --- |
| APROBADO_FIGMA | Geometría, tokens, variantes, recorridos y reglas documentados en el archivo/brief. Una interacción de Figma puede simular efectos que aún no tienen backend. |
| EXISTING_REPORTED | Solo GET /health y POST /api/v1/audits, reportados por el usuario en FastAPI de desarrollo. No se inspeccionó OpenAPI ni se realizaron llamadas reales en3C. |
| PROPOSED_NOT_IMPLEMENTED | DTO, endpoint o decisión técnica propuesta para cubrir el MVP. Requiere conciliar con la API y aprobación técnica. |
| FUTURE_PROVIDER_INTEGRATION | Pasarela, checkout, cancelación facturable y webhooks. Sin proveedor o implementación confirmados. |
| DEMO | Valores de Figma: nombres de usuario, demo-001, fechas America/Lima, resultados, checkout, créditos y animaciones de inicio/fin. No datos reales ni certificaciones. |

## 2. Arquitectura de marca y entornos

| Recurso | Dominio aprobado | Regla |
| --- | --- | --- |
| Frontend producción | qa.kevosilva.dev | Origen canónico público; usar HTTPS en implementación. |
| API producción | api.qa.kevosilva.dev | No representa una comprobación de disponibilidad realizada en3C. |
| Frontend desarrollo | dev.qa.kevosilva.dev | Entorno de integración futura; no mezclar sesiones/datos de producción. |
| API desarrollo | api.dev.qa.kevosilva.dev | API reportada por el usuario. |
| Portfolio personal | kevosilva.dev | Marca personal KevoSilva; no se modifica. |

KevoLint mantiene identidad comercial independiente de n8n. Las menciones descriptivas a workflows para n8n permanecen; no usar su logotipo ni afirmar afiliación o certificación. No se propone ningún dominio nuevo.

## 3. Matriz de rutas y pantallas

Se extrajeron 363 frames: 20 de Public & Auth, 20 de SaaS App, 28 de States y 295 de Prototype. La referencia canónica para navegación es Prototype; las páginas 03–05 mantienen los diseños fuente. El inventario comprende 114 pantallas, 141 estados, 94 overlays y 14 referencias de revisión. Estas categorías describen frames, no 363 URLs.

La matriz siguiente identifica las18 rutas principales. Los cuatro IDs por fila son referencias actuales y exactas. matriz-rutas.csv añade propósito, estados, componentes, acciones, dependencia de autenticación, datos y prioridad. manifests/frames.json y inventario-frames.csv incluyen cada uno de los363 frames con sus componentes, disparadores, cantidad de hotspots y destinos observados.

| Ruta | Pantalla / prioridad | 1440 | 768 | 390 | 320 |
| --- | --- | --- | --- | --- | --- |
| / | Landing / P0 | [19:2](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-2) | [133:22214](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-22214) | [19:99](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-99) | [126:11440](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-11440) |
| /como-funciona | Cómo funciona / P1 | [19:196](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-196) | [133:22538](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-22538) | [19:257](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-257) | [126:11747](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-11747) |
| /precios | Precios públicos / P0 | [19:318](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-318) | [133:22704](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-22704) | [19:347](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-347) | [126:11908](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-11908) |
| /seguridad | Seguridad / P1 | [19:376](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-376) | [133:22898](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-22898) | [19:409](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-409) | [126:12090](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12090) |
| /ayuda | Ayuda / P1 | [19:442](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-442) | [125:9829](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-9829) | [19:476](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-476) | [126:12212](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12212) |
| /legal/terminos | Términos / P1 | [19:510](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-510) | [125:9942](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-9942) | [19:535](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-535) | [126:12325](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12325) |
| /legal/privacidad | Privacidad / P1 | [19:560](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-560) | [125:10032](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10032) | [19:585](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-585) | [126:12415](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12415) |
| /legal/cookies | Cookies / P1 | [19:610](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-610) | [125:10122](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10122) | [19:633](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-633) | [126:12505](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12505) |
| /sign-in | Inicio de sesión / P0 | [19:656](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-656) | [125:10220](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10220) | [19:678](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-678) | [126:12603](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12603) |
| /sign-up | Registro / P0 | [19:700](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-700) | [125:10358](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10358) | [19:724](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-724) | [126:12741](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12741) |
| /app | Dashboard / P0 | [19:748](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-748) | [19:1189](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1189) | [19:781](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-781) | [126:12882](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=126-12882) |
| /app/auditorias/nueva | Nueva auditoría / P0 | [19:806](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-806) | [125:10529](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10529) | [19:836](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-836) | [19:1263](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1263) |
| /app/auditorias | Historial / P0 | [19:865](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-865) | [125:10620](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10620) | [19:901](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-901) | [133:14027](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-14027) |
| /app/auditorias/[id] | Informe / P0 | [19:929](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-929) | [19:1214](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1214) | [19:979](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-979) | [133:14220](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-14220) |
| /app/plan | Mi plan / P0 | [19:1028](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1028) | [125:10803](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10803) | [19:1063](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1063) | [133:14419](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-14419) |
| /app/planes | Explorar planes / P0 | [56:10542](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=56-10542) | [125:11063](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-11063) | [56:10678](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=56-10678) | [133:20175](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-20175) |
| /app/configuracion | Configuración / P1 | [19:1097](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1097) | [125:10878](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10878) | [19:1124](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1124) | [133:14494](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-14494) |
| /app/facturacion/resultado | Resultado de pago / P1 | [19:1150](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1150) | [125:10972](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-10972) | [19:1170](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1170) | [133:14593](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-14593) |

### 3.1. Responsabilidad, estados y navegación por ruta

#### / — Landing

Presentar auditoría estática para n8n y comenzar prueba. Autenticación: public. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | QAMotorCard, BrandLogo, Button, SeverityBadge, PlanCard, Accordion, PublicHeader, Footer |
| Estados | default, hero reveal, FAQ abierta, planes hover |
| Acciones y reglas | Abrir cómo funciona, precios, seguridad, ayuda; registrarse o iniciar sesión. |
| Datos necesarios | Contenido editorial; catálogo comercial pendiente; sin resultados inventados. |
| Operaciones relacionadas | plans |

#### /como-funciona — Cómo funciona

Explicar importación, análisis estático y lectura del informe. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, SeverityBadge, PublicHeader, Footer |
| Estados | default, FAQ abierta |
| Acciones y reglas | Volver a inicio; abrir precios o registro. |
| Datos necesarios | Contenido editorial; muestra de informe marcada demo. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /precios — Precios públicos

Comparar Starter, Pro y Power desde el sitio público. Autenticación: public. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, SeverityBadge, PlanCard, PublicHeader, Footer |
| Estados | tres planes, recomendado Pro, selección |
| Acciones y reglas | Seleccionar plan conserva intención; solicitar sesión antes de checkout real. |
| Datos necesarios | Catálogo/precios del backend pendientes; no inventar importes. |
| Operaciones relacionadas | plans |

#### /seguridad — Seguridad

Explicar límites y tratamiento del workflow sin afirmar certificaciones. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, PublicHeader, Footer |
| Estados | default |
| Acciones y reglas | Header y footer públicos. |
| Datos necesarios | Texto validado sobre prácticas efectivamente implementadas. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /ayuda — Ayuda

Preguntas frecuentes y recuperación guiada. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, Input, PublicHeader, Footer |
| Estados | acordeón cerrado/abierto |
| Acciones y reglas | Navegación pública; vínculos a importación requieren sesión. |
| Datos necesarios | Contenido de ayuda; no servicio de soporte nuevo. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /legal/terminos — Términos

Presentar condiciones y aceptación aplicable. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, PublicHeader, Footer |
| Estados | lectura |
| Acciones y reglas | Footer; retorno a origen de registro. |
| Datos necesarios | Texto legal final pendiente de revisión del responsable. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /legal/privacidad — Privacidad

Explicar tratamiento y conservación de datos. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, PublicHeader, Footer |
| Estados | lectura |
| Acciones y reglas | Footer; conservar contexto de autenticación. |
| Datos necesarios | Política real de conservación y proveedores, por validar. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /legal/cookies — Cookies

Describir el uso real de cookies. Autenticación: public. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, PublicHeader, Footer, Checkbox |
| Estados | lectura |
| Acciones y reglas | Footer. |
| Datos necesarios | Inventario de cookies real pendiente; no inventar consentimiento implementado. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /sign-in — Inicio de sesión

Entrar mediante Clerk. Autenticación: guest. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, SeverityBadge, Input, PublicHeader, Footer |
| Estados | idle, loading, invalid, rate limited, MFA, reset |
| Acciones y reglas | Sesión válida → returnTo interno permitido o /app; enlace a registro. |
| Datos necesarios | Estado Clerk; proveedor/métodos habilitados por confirmar. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /sign-up — Registro

Crear cuenta y verificar identidad con Clerk. Autenticación: guest. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, SeverityBadge, Input, PublicHeader, Footer, Checkbox |
| Estados | idle, terms required, loading, verify email, error |
| Acciones y reglas | Verificación completada → /app; aceptar condiciones según política. |
| Datos necesarios | Clerk y creación idempotente de usuario/beneficio Free en backend. |
| Operaciones relacionadas | Contenido editorial o Clerk; sin endpoint de negocio nuevo. |

#### /app — Dashboard

Mostrar cuota vigente, auditorías completadas y último informe. Autenticación: required. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | AuditTableRow, AuditCard, BrandLogo, Button, NavItem, KPIStat, UsageMeter, AppSidebar, AppTopbar |
| Estados | loading, empty, Free, paid, 80%, exhausted, error |
| Acciones y reglas | Nueva auditoría solo si hay cuota; historial, Mi plan y Explorar planes separados. |
| Datos necesarios | Resumen autenticado, UsageSnapshot y última auditoría completada; API pendiente. |
| Operaciones relacionadas | viewer, usage, listAudits |

#### /app/auditorias/nueva — Nueva auditoría

Importar JSON y crear una auditoría estática. Autenticación: required. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, Input, NavItem, UsageMeter, AppSidebar, AppTopbar, UploadDropzone, VersionSelector |
| Estados | empty, ready, validation, submitting, processing, 413, 415, 422, 409 recovered, 429, offline |
| Acciones y reglas | Tras completarse → informe del ID devuelto; idempotencia recupera progreso o resultado existentes. |
| Datos necesarios | POST /api/v1/audits reportado; esquema/auth/headers exactos por verificar con OpenAPI. |
| Operaciones relacionadas | createAudit, recoverAttempt, auditStatus, usage |

#### /app/auditorias — Historial

Buscar y filtrar auditorías propias. Autenticación: required. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | FilterField, AuditTableRow, AuditCard, BrandLogo, Button, NavItem, UsageMeter, EmptyState, AppSidebar, AppTopbar |
| Estados | loading, rows, filtered, empty, no results, error |
| Acciones y reglas | Abrir informe propio; filtros consistentes; reset no abandona historial. |
| Datos necesarios | Lista propia paginada con búsqueda, severidad, fecha y versión; API pendiente. |
| Operaciones relacionadas | listAudits, deleteAudit |

#### /app/auditorias/[id] — Informe

Leer hallazgos, evidencia sanitizada y recomendaciones. Autenticación: required+owner. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | ReportSelect, BrandLogo, Button, SeverityBadge, NavItem, KPIStat, UsageMeter, FindingCard, AppSidebar, AppTopbar |
| Estados | pending, processing, completed, filtered, finding detail, failed, 403, 404, 410 |
| Acciones y reglas | demo-001 y expirado son valores de ejemplo del parámetro, no dos rutas nuevas. |
| Datos necesarios | Informe propio, estado real, expiración y metadatos del análisis; lectura persistida pendiente. |
| Operaciones relacionadas | auditStatus, report |

#### /app/plan — Mi plan

Consultar plan activo, consumo, periodo y renovación. Autenticación: required. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, NavItem, UsageMeter, AppSidebar, AppTopbar |
| Estados | Free, Starter, Pro, Power, active, 80%, exhausted, cancel scheduled |
| Acciones y reglas | Explorar planes → /app/planes; cancelación en diálogo; compra no cambia cuota hasta confirmación. |
| Datos necesarios | Suscripción/UsageSnapshot/periodo/renovación; API pendiente. |
| Operaciones relacionadas | subscription, usage, cancelSubscription |

#### /app/planes — Explorar planes

Abrir directamente el comparador de suscripciones. Autenticación: required. Prioridad: P0.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, NavItem, UsageMeter, PlanCard, AppSidebar, AppTopbar |
| Estados | Starter, Pro recommended, Power, current plan, selected, pending |
| Acciones y reglas | Seleccionar → checkout; /app/plan#checkout-demo es fragmento simulado existente. |
| Datos necesarios | Catálogo sin precios inventados; selección y checkout real pendientes. |
| Operaciones relacionadas | plans, subscription, checkout |

#### /app/configuracion — Configuración

Preferencias y controles de cuenta previstos por el prototipo. Autenticación: required. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, Input, NavItem, UsageMeter, AppSidebar, AppTopbar, Checkbox |
| Estados | default, saved, validation, delete confirmation |
| Acciones y reglas | Gestión de identidad con Clerk; acciones destructivas requieren confirmación y backend. |
| Datos necesarios | Perfil/preferencias/solicitud de eliminación: operaciones reales pendientes de contrato y política. |
| Operaciones relacionadas | viewer, preferences, accountDeletion |

#### /app/facturacion/resultado — Resultado de pago

Consultar resultado confirmado de un intento de pago. Autenticación: required+owner. Prioridad: P1.

| Aspecto | Especificación |
| --- | --- |
| Componentes | BrandLogo, Button, NavItem, UsageMeter, AppSidebar, AppTopbar, CheckoutReturnStatus |
| Estados | verifying, pending, confirmed, failed, cancelled |
| Acciones y reglas | Reconsultar backend; confirmado → Mi plan o Dashboard; fallo/cancelación → comparador. |
| Datos necesarios | Estado del intento y suscripción desde servidor; pasarela y webhooks futuros. |
| Operaciones relacionadas | billingAttempt, subscription, usage |

### 3.2. Rutas auxiliares, estados y overlays

| Ruta existente en Figma | 1440 /768 /390 /320 | Adaptación técnica |
| --- | --- | --- |
| /403 | [19:1518](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1518) / [125:11574](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-11574) / [112:8742](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=112-8742) / [133:20694](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-20694) | HTTP 403 de una operación autorizada; la URL /403 ya aparece en Figma. Conservar página visual o renderizar estado según contrato; no filtrar información de terceros. |
| /404 | [19:1506](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1506) / [125:11445](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=125-11445) / [112:8578](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=112-8578) / [133:20584](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=133-20584) | La etiqueta /404 existe en Figma. En App Router usar not-found para URL desconocida; no redirigir todos los 404 a una URL nueva. |
| /sign-up/verify | [19:1710](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1710) / [130:19718](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-19718) / [20:4722](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=20-4722) / [130:20272](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-20272) | Subestado de Clerk bajo sign-up; mantener el recorrido, no implementar verificación propia. |
| /sign-in/reset | [19:1723](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1723) / [130:19827](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-19827) / [20:4723](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=20-4723) / [130:20381](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-20381) | Subestado Clerk bajo sign-in; no almacenar contraseñas en FastAPI. |
| /sign-in/mfa | [19:1736](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-1736) / [130:19935](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-19935) / [20:4724](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=20-4724) / [130:20489](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=130-20489) | Subestado Clerk; depender de configuración efectiva del tenant. |

/app/auditorias/demo-001 y /app/auditorias/expirado son ejemplos de valores para /app/auditorias/[id]. La parametrización es una traducción de la ruta aprobada, no una función nueva. /app/plan#checkout-demo es un fragmento existente exclusivo del prototipo; no convertirlo en una ruta pública de pago real.

500,502/503, sesión caducada,413/415/422,429 y los estados comerciales se renderizan en su contexto. No crear /500, /413 o rutas de producto adicionales sin necesidad y aprobación. Los overlays version, account, delete, cancelplan, recoverydone, authrate, termsrequired, billingrequired, statsempty, statsdemo y los filtros siguen siendo UI local, no páginas independientes. statsdemo es evidencia ficticia, no una métrica comercial.

Propuesta App Router: separar grupos de layout público, autenticación y aplicación sin cambiar URLs. Las carpetas de grupos no se convierten en segmentos públicos. Los subpasos de autenticación se adaptarán al routing real de Clerk; no se implementarán desafíos de contraseña/MFA propios. Proteger datos cerca de su lectura, además de cualquier guard de navegación.

## 4. Design System: tokens y medidas

manifests/tokens.json conserva61 tokens de diseño con ID, colección, nombre original, valores por modo y alias resueltos. Las207 variables restantes pertenecen al prototipo y están expresamente excluidas como fuente de reglas de producción. Existen82 estilos de texto locales; se documentan como tipografía activa los10 estilos Inter utilizados por la interfaz. Las otras exploraciones no se migran globalmente.

### 4.1. Colores del tema oscuro

| Token semántico | Valor | Uso |
| --- | --- | --- |
| background | #0A0B0E | Fondo de página |
| surface | #14161B | Contenedores y tarjetas |
| raised | #1C1F25 | Superficie elevada/feedback leve |
| border | #2A2D35 | Separación decorativa; no sustituye borde accesible de control |
| text | #EDEDF2 | Texto principal |
| muted | #9297A3 | Texto secundario |
| accent | #AB8DFA | Marca y acciones |
| critical | #FF8F9A | Error y consumo alto |
| warning | #EFC477 | Advertencia |
| success | #91D4B6 | Éxito y consumo normal |
| usage-moderate | #F6AD55 | Consumo50–79% |
| control-border | #686E7A | Límite visible de controles |
| destructive-default | #272025 | Fondo acción destructiva |
| destructive-hover | #3A292F | Fondo hover destructivo |
| destructive-pressed | #4C3339 | Fondo pressed destructivo |

No usar violeta para expresar error o agotamiento. Los estados semánticos mantienen color, texto y cuando corresponda icono. Los colores claros de la colección de exploración sirven para logos en superficies claras; no constituyen un tema claro integral del SaaS aprobado. El modo High contrast existente se exporta con sus valores reales y una incidencia identificada; no se debe asumir que cumple accesibilidad en todos sus estados.

### 4.2. Tipografía activa

| Rol | Fuente / peso | Tamaño / interlínea | Tracking |
| --- | --- | --- | --- |
| Display | Inter 600 | 48 / 56 px | -1 px |
| H1 | Inter 600 | 40 / 48 px | -1 px |
| H2 | Inter 600 | 32 / 40 px | -1 px |
| H3 | Inter 600 | 24 / 32 px | 0 px |
| Title | Inter 600 | 20 / 28 px | 0 px |
| Body | Inter 400 | 16 / 24 px | 0 px |
| Body Strong | Inter 600 | 16 / 24 px | 0 px |
| Label | Inter 500 | 14 / 20 px | 0 px |
| Small | Inter 400 | 12 / 18 px | 0 px |
| Small Strong | Inter 600 | 12 / 18 px | 0 px |

Usar Inter para landing, títulos, subtítulos, cuerpo, botones, KPI e informes. Los títulos pueden adoptar las variantes compactas existentes de cada frame; no reducir todo con una transformación CSS. Para JSON, rutas y código se propone Geist Mono, con validación de ancho y altura de línea antes de introducirlo. No convertir W3 en una fuente de formularios ni sustituirlo por texto estándar. Los KPI deben usar cifras tabulares cuando la fuente lo permita, manteniendo el tamaño del componente.

### 4.3. Espaciado, bordes, radios, elevación y tamaños

| Grupo | Regla |
| --- | --- |
| Espaciado existente | 0,4,8,12,16,24,32,48,64 px. Padding y gaps deben usar esta escala cuando encaje. |
| Radios existentes | 8,12,16 px; el componente Button existente utiliza12 px. No introducir una escala de píldoras nueva. |
| Bordes | 1 px para contenedores y controles; foco visible2 px. Diferenciar borde decorativo de control-border. |
| Elevación | No hay estilos de efectos/sombra publicados. La separación actual usa background/surface/raised y bordes. No inventar una escala de sombras como si estuviera aprobada. |
| Capas propuestas | Contenido0, sticky10, backdrop40, drawer50, modal60, toast70, tooltip80. Son niveles relativos propuestos, no variables actuales de Figma. |
| Header público | 1440:80 px; compacto68 px. Área de logo194×44 px. |
| Aplicación | Sidebar240 px; topbar desktop72 px, compacto64 px. |
| Interacción | Objetivo táctil mínimo44 px. Altura ampliable si el texto ocupa dos líneas. Filtros: control44 px, aunque wrapper con label mida70/80/96 px. |
| Cards de referencia | PlanCard336×416; QAMotorCard288×224; KPIStat320×148; AuditTableRow1056×72; AuditCard350×184. Adaptar ancho; no fijar alto que recorte contenido. |
| Transiciones | Hover180 ms, pressed150 ms, contenido280 ms, drawer240 ms, UsageMeter300 ms. Son ajustes específicos, no un único delay para toda la interfaz. |

## 5. Componentes React/Next.js y composición

manifests/components.json identifica67 componentes/familias, propiedades y todas sus variantes nativas, con tamaños y referencias exactas. No crear un componente por pantalla ni un componente por cada porcentaje. Las variantes de Figma se traducen a props y estados del mismo componente React. MotionPreview es una referencia documental y no un componente de negocio a publicar.

| Familia de implementación | Fuentes Figma | Responsabilidad / contrato de UI |
| --- | --- | --- |
| BrandLogo | [393:752](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-752) | composition, surface, size y nombre accesible; elegir SVG original correspondiente, escala proporcional. |
| PublicHeader / Footer | [4:173](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-173) / [4:352](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-352) | Rutas públicas, marca, estado de sesión y enlaces legales; mismo origen de navegación. |
| AppShell / Sidebar / AppTopbar / MobileNavDrawer | [4:174](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-174) / [4:285](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-285) | Composición privada, item activo y drawer accesible; recibe sesión y UsageSnapshot, no calcula permisos de compra. |
| Button / TextLink | [3:194](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-194) / [16:267](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-267) | variant, disabled, loading, icon y contenido. Un link navega; un botón realiza acción. Disabled no debe esconder navegación activa. |
| Input / SelectField / Radio / Checkbox / Switch | [3:257](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-257) / [16:277](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-277) / [16:251](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-251) / [4:524](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-524) / [16:258](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-258) | Label, value, error, hint y disabled. Un control semántico con wrappers por contexto. |
| HistoryFilterField / ReportFilterSelect | [106:1464](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=106-1464) / [199:1047](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=199-1047) | Especializaciones de Select/Input accesibles, no dos bibliotecas de select. |
| Card / KpiCard / QAMotorCard | [3:275](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-275) / [120:726](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=120-726) | Contenedores relacionados, datos reales para KPI, iconos correctos de los cuatro motores. |
| AuditList / AuditRow / AuditListCard / Pagination | [120:736](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=120-736) / [120:753](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=120-753) / [3:440](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-440) | Mismo modelo y acciones, tabla desktop o cards compactas; lista paginada propia. |
| Tabs / Accordion | [16:330](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-330) / [3:421](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-421) | Selección/disclosure local, teclado y estado accesible. |
| Dialog / Drawer / Tooltip | [4:517](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-517) / [4:590](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-590) | Primitiva accesible compartida; distintas composiciones de confirmación o filtros. Tooltip no contiene información esencial exclusiva. |
| Alert / Toast / EmptyState / Skeleton | [3:368](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-368) / [4:585](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-585) / [16:380](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-380) / [3:422](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-422) / [3:436](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-436) | Un Toast base con tono y contenido; Alert persistente dentro del módulo; loading no afirma dato cero. |
| UsageMeter / TrialQuotaCard / SubscriptionStatusCard | [3:294](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-294) / [16:351](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-351) / [16:350](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-350) | Misma lectura de cuota/periodo y fuente de verdad; Full/Compact/320 son presentaciones. |
| UploadDropzone / FileMetadata / VersionSelector / AuditProgressPanel | [4:402](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-402) / [16:331](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-331) / [4:403](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-403) / [3:402](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-402) | Entrada JSON y estados técnicos; validación cliente advisory; backend vuelve a validar. |
| PlanCard / PlanGrid / CheckoutReturnStatus / BillingHistory | [3:336](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-336) / [4:584](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-584) / [16:360](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-360) | Catálogo, selección, plan actual y resultado backend; precio nulo no se muestra como gratis. |
| FindingCard / FindingDetail / SeverityBadge / RetentionNotice | [3:369](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-369) / [199:1009](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=199-1009) / [3:226](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-226) / [16:387](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-387) | Hallazgos sanitizados, filtros, contexto de nodo, severidad y expiración real. |
| FullPageError | [106:1631](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=106-1631) | Código, título, explicación, icono y recuperación; aplica al área útil, no ocupa siempre toda la ventana. |
| AuditLoader / HeroTitle | [120:851](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=120-851) / [120:911](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=120-911) | Presentación de estado o entrada; jamás cambia el resultado del análisis. |

Los iconos deben salir de las fuentes vectoriales existentes. Ciberseguridad e Integraciones usa escudo; Arquitectura y Escalabilidad usa diagrama de nodos; Lógica y Flujo de Datos usa conexiones; Prompt Engineering y Agentes IA usa agente/cerebro. Conservar esos cuatro nombres, sin volver a categorías históricas. Componentes de icono con ID y nombre están incluidos en el manifiesto; no se exige instalar otra biblioteca de iconos.

### 5.1. Propiedades y límites de responsabilidad

PlanCard recibe plan, estado actual/seleccionado, recomendación y onSelect; no activa suscripciones. UsageMeter recibe números y periodo del snapshot vigente; no posee un contador de créditos independiente. AuditList recibe resultados/paginación/estado y handlers; no mezcla mock y API real silenciosamente. Report recibe un resultado sanitizado y filtros; el control de propiedad y expiración pertenece al servidor.

PublicLayout y AppShell comparten BrandLogo y primitivas. Dialog/Drawer comparten foco e infraestructura modal, conservando dimensiones por contexto. Toast y ToastFeedback de Figma convergen en un Toast con variantes. FilterField y ReportSelect pueden compartir una misma base de control sin perder las diferencias de etiqueta, tamaño y criterios. No duplicar reglas de cuota en sidebar, Dashboard y Mi plan.

## 6. Identidad, recursos y licencias

### 6.1. Geometría y usos de marca

Mantener el maestro R2/C3 y W3 aprobados. Isotipo: grosor L10 u, ancho horizontal de diagonales11 u, separación L→primera diagonal4 u, centro horizontal de tinta32 u, inclinación22,62°, tinta50×48 sobre módulo64. Las variantes ópticas16/24 existentes se exportan directamente; no redibujar ni simplificar de nuevo.

Composiciones: Horizontal, Compact, Wordmark, Symbol, WithSignature y WithDescriptor, para Dark/Light. Área de protección X=8 u sobre módulo64; separación símbolo/wordmark16 u en el sistema original. Mínimos de referencia: Horizontal194 px, Wordmark144 px, Compact140 px; firma o descriptor380 px o textos auxiliares separados que sigan siendo legibles. Header/sidebar usan194 px dentro de hit area44 px de alto. Drawer320 conserva Wordmark144 y cierre suficiente para dos líneas.

No estirar un eje, rotar, recolorear con semánticos de error, reconstruir W3 con una fuente, cambiar K/L, usar W1/W2, fusionar con logotipo n8n ni animar constantemente en el dashboard. El enlace de inicio necesita nombre accesible «KevoLint · Inicio»; ocultar paths decorativos a lectores de pantalla cuando el control ya proporciona el nombre.

### 6.2. SVG originales exportados

| Archivo | Nodo exacto | Maestro w×h | Uso |
| --- | --- | --- | --- |
| kevolint-horizontal-light.svg | [393:558](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-558) | 380.00×64.13 | BrandLogo / maestro aprobado |
| kevolint-wordmark-dark.svg | [393:615](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-615) | 300.00×64.13 | BrandLogo / maestro aprobado |
| kevolint-wordmark-light.svg | [393:632](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-632) | 300.00×64.13 | BrandLogo / maestro aprobado |
| kevolint-compact-dark.svg | [393:574](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-574) | 220.00×123.03 | BrandLogo / maestro aprobado |
| kevolint-compact-light.svg | [393:600](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-600) | 220.00×123.03 | BrandLogo / maestro aprobado |
| kevolint-symbol-dark.svg | [393:642](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-642) | 64.00×64.00 | BrandLogo / maestro aprobado |
| kevolint-symbol-light.svg | [393:648](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-648) | 64.00×64.00 | BrandLogo / maestro aprobado |
| kevolint-signature-dark.svg | [393:654](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-654) | 380.00×81.13 | BrandLogo / maestro aprobado |
| kevolint-signature-light.svg | [393:684](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-684) | 380.00×81.13 | BrandLogo / maestro aprobado |
| kevolint-symbol-16.svg | [368:6548](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6548) | 16.00×16.00 | Variante óptica |
| kevolint-symbol-24.svg | [368:6558](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6558) | 24.00×24.00 | Variante óptica |
| kevolint-symbol-32.svg | [368:6568](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6568) | 32.00×32.00 | Variante óptica |
| kevolint-symbol-48.svg | [368:6578](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6578) | 48.00×48.00 | Variante óptica |
| kevolint-symbol-64.svg | [368:6588](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6588) | 64.00×64.00 | Variante óptica |
| kevolint-symbol-128.svg | [368:6598](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6598) | 128.00×128.00 | Variante óptica |
| kevolint-symbol-16-mono.svg | [368:6553](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6553) | 16.00×16.00 | Variante óptica |
| kevolint-wordmark-mono.svg | [368:7152](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-7152) | 300.00×64.13 | BrandLogo / maestro aprobado |
| kevolint-horizontal-mono.svg | [368:7176](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-7176) | 380.00×64.13 | BrandLogo / maestro aprobado |
| kevolint-app-icon-64.svg | [369:7147](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=369-7147) | 64.00×64.00 | BrandLogo / maestro aprobado |
| kevolint-app-icon-128.svg | [369:7159](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=369-7159) | 128.00×128.00 | BrandLogo / maestro aprobado |
| kevolint-w3-core-master.svg | [368:6645](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6645) | 467.77×100.00 | BrandLogo / maestro aprobado |
| kevolint-descriptor-dark.svg | [393:703](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-703) | 380.00×81.13 | BrandLogo / maestro aprobado |
| kevolint-descriptor-light.svg | [393:733](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-733) | 380.00×81.13 | BrandLogo / maestro aprobado |
| kevolint-horizontal-dark.svg | [393:531](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-531) | 380.00×64.13 | BrandLogo / maestro aprobado |

Cada SVG incluye viewBox y trazados editables; no contiene imágenes raster ni texto dependiente de fuentes. manifests/assets.json conserva hashes SHA256 y los límites exactos exportados. Figma redondea algunos bounds de exportación a píxeles enteros, por ejemplo380×65 frente al maestro380×64,1339; ese pequeño espacio transparente no autoriza deformar el dibujo. Mantener preserveAspectRatio y escalar proporcionalmente dentro del slot.

### 6.3. Favicons, app icons y vista social

| Archivo | Formato / tamaño | Procedencia |
| --- | --- | --- |
| favicon-16.png | PNG / [16, 16] | [368:6548](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6548) |
| favicon-32.png | PNG / [32, 32] | [368:6568](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=368-6568) |
| apple-touch-icon.png | PNG / [180, 180] | [369:7159](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=369-7159) |
| app-icon-192.png | PNG / [192, 192] | [369:7159](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=369-7159) |
| app-icon-512.png | PNG / [512, 512] | [369:7159](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=369-7159) |
| kevolint-social-preview.png | PNG / [1200, 630] | [423:329](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=423-329) |
| favicon.ico | ICO / [[16, 16], [32, 32]] | Contenedor de los PNG ópticos16 y32 exactos |

La tarjeta social1200×630 es un recurso editable nuevo de esta entrega, en [423:329](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=423-329). Usa la composición original, descriptor y dominio correctos; se presenta para revisión, sin desplegarse. Los PNG son derivados para formatos que los requieren; los logotipos oficiales siguen disponibles en SVG. favicon.ico conserva exactamente los píxeles de los renders ópticos16 y32. Para metadatos privados usar marca genérica; nunca título, evidencia o datos del workflow auditado.

### 6.4. Tipografía y licencias

| Familia | Papel | Licencia / fuente oficial |
| --- | --- | --- |
| Inter | Current general UI: landing, titles, body, controls, KPI and report prose | SIL Open Font License1.1 · [fuente](https://github.com/rsms/inter/blob/master/LICENSE.txt) |
| Space Grotesk | Source of approved W3 contours; personalized K/L. Logo supplied as SVG paths, not a font. | SIL Open Font License1.1 · [fuente](https://github.com/floriankarsten/space-grotesk/blob/master/OFL.txt) |
| Geist Mono | Proposed technical JSON/code role; verify font metrics in implementation | SIL Open Font License1.1 · [fuente](https://github.com/vercel/geist-font/blob/main/LICENSE.txt) |

No se adjuntan ni redistribuyen archivos de fuentes. Durante implementación, descargar o instalar desde las fuentes oficiales, conservar avisos y licencia del paquete elegido y verificar su versión. El logo es un documento de contornos personalizado; no es una familia de fuente derivada para distribuir. Bricolage Grotesque, Plus Jakarta Sans, Sora y Geist Sans permanecen como exploración histórica; no son una instrucción de migración de la interfaz aprobada.

### 6.5. Reexportación manual reproducible

Seleccionar el nodo exacto del manifiesto, no el frame de comparación. Elegir Export→SVG, activar Outline text y conservar el viewBox original; exportar Dark y Light por separado. Para16/24 elegir el maestro óptico correspondiente; para app icon seleccionar el64/128 aprobado antes de exportar al tamaño de salida. No exportar la captura de la página de marca como logo. Comparar los contornos K/L y los tres segmentos con el maestro, además del aspecto visual. PNG/ICO se reservan para favicons, metadatos o plataformas que no acepten SVG. Los iconos funcionales restantes se exportan desde los componentes Icon/ identificados en components.json.

## 7. Responsive y reglas de layout

Los cuatro tamaños aprobados son muestras de aceptación; no son cuatro sitios separados. La propuesta de breakpoint de implementación es compacto hasta767, tablet desde768 y sidebar desde1024. No hay una variable Figma que imponga1024; comprobar también anchos intermedios antes de fijar el CSS definitivo. Mantener320 px como ancho mínimo de validación, no escalar una captura de390.

| Elemento | 1440×900 | 768×1024 | 390×844 | 320×844 |
| --- | --- | --- | --- | --- |
| Layout público | Contenedor1200; padding lateral120; hero horizontal con gap48. | Contenido704 y padding32; hero vertical; header compacto. | Contenido350 y padding20; secciones verticales. | Contenido288 y padding16; copy refluye, no recortar. |
| Layout privado | Sidebar240 + área1200; topbar72. | Sin sidebar fijo; topbar64 y drawer; padding32. | Topbar64; padding20; secciones gap24. | Topbar64; padding16; flujo completo y scroll. |
| Navegación | Links visibles y sidebar. | Drawer con todas las rutas. | Drawer accesible; cerrar al navegar. | Wordmark144 y cierre con alto suficiente. |
| Cards/KPI | Grupos en columnas según ancho;3 KPI máximo. | Dos columnas donde quepan; último item envuelve. | Una columna; toda la información se conserva. | Una columna; min-width0 en contenedores anidados. |
| Planes | Tres cards iguales; CTA alineado. | Dos columnas si cabe la referencia336; tercera en fila siguiente. | Una columna a ancho del contenedor. | Ancho288 útil o ancho interior del panel; no heredado336. |
| Tabla/historial | AuditRow; búsqueda izquierda y filtros derecha. | Control compacto y reorganización por espacio. | AuditCard conserva campos y acciones; búsqueda full + botón Filtros. | Mismo panel con criterios y chips; sin pérdida de filtros. |
| Importación/formularios | Dropzone y campos alineados; alerts dentro del módulo. | Anchos fluidos y labels persistentes. | Botones primarios fill; padding12–16; min44. | Texto adaptable, altura automática; no 66 px fijo dentro del botón. |
| Informe/JSON | Lectura amplia y detalle contextual. | Reflujo de columnas; filtros conservados. | Hallazgos y evidencia accesibles; detalle viewport. | Romper palabras largas; scroll interno para código cuando sea necesario. |
| Errores | Composición centrada en área útil; acciones bajo mensaje. | Reducir ancho máximo y permitir scroll. | Sin clipping de descripción o CTAs. | Botones pueden crecer; no modificar alto total del viewport para ocultar errores. |

No imponer900/844 px como altura de página web. Usar altura mínima del viewport y contenido que pueda crecer. Si header/sidebar son sticky, mantener su offset y foco visible; no tapar destinos de ancla o validación. El comportamiento sticky es una decisión de implementación a validar, no una autorización para inmovilizar paneles que en el prototipo se desplazan. Drawer/modal: scroll interno accesible, fondo bloqueado solo mientras esté abierto, safe-area en móvil y cierre siempre alcanzable.

Para texto largo: min-width0 en flex/grid, ancho del texto flexible, line-height consistente y overflow-wrap en identificadores. Los botones deben centrar texto horizontal/verticalmente y usar alto mínimo, no alto fijo con texto que pueda crecer. Los controles de demostración se agrupan como «Controles de prueba» en el harness de prototipo; no se publican como acciones normales del SaaS. No corregir restricciones con espacios o saltos de línea manuales.

## 8. Accesibilidad prevista y contraste

El objetivo es WCAG 2.2 AA, sin declarar certificación. Texto normal4,5:1; texto grande3:1; límites/estados visuales de controles y foco3:1 donde aplique. El objetivo táctil del producto es44 px; WCAG 2.2 AA establece su criterio de tamaño mínimo en24 px con excepciones, por lo que no se debe atribuir44 px como obligación AA general. No usar solo color para consumo, errores o severidad.

| Área | Criterio de implementación |
| --- | --- |
| Estructura | Un H1 por vista de contenido; headings jerárquicos, landmarks y enlace para saltar navegación. Iconos redundantes decorativos; iconos sin texto con nombre accesible. |
| Teclado | Tab/Shift+Tab en orden lógico; Enter/Space para botones; navegación semántica para tabs/radios/select. Evitar divs clicables sin semántica. |
| Foco | Visible2 px y contraste suficiente; nunca ocultarlo globalmente. Al cambiar ruta, llevar foco al título/contenido según patrón consistente; no volver al principio ante filtros que no navegan. |
| Diálogos/drawers | Nombre accesible, rol modal cuando corresponda, foco inicial útil, background inert, foco contenido, Escape y restauración al disparador. No llevar foco inicial a una acción destructiva por defecto. |
| Validación | Label persistente; aria-invalid/aria-describedby; mensaje junto al campo y resumen útil si hay varios. No anunciar errores por cada pulsación. |
| Estado asíncrono | aria-busy y estado polite; anunciar final o error una vez. No leer cada frame de Count Up ni cada pulso del loader. Alert urgente solo cuando sea necesario. |
| Upload | Input file accesible además de drag/drop; nombre/formato/tamaño explicados; seleccionar otro archivo por teclado. |
| Tablas | Encabezados y relaciones correctos; alternativa card conserva etiquetas y acciones. No ocultar columnas esenciales solo para que quepa. |
| Reduced motion | Respetar prefers-reduced-motion desde primera renderización; contenido final sin stagger, transform ni bucles no esenciales. La accesibilidad y el estado real se mantienen. |
| Prueba humana | Recorrido teclado, lector de pantalla y zoom/reflow manual complementan axe; la automatización no certifica AA. |

### 8.1. Cálculo de pares de color

| Par | Foreground / background | Ratio | Resultado |
| --- | --- | --- | --- |
| Texto / surface | #EDEDF2 / #14161B | 15.51 | PASS_CALCULATION |
| Muted / surface | #9297A3 / #14161B | 6.19 | PASS_CALCULATION |
| Accento / background | #AB8DFA / #0A0B0E | 7.42 | PASS_CALCULATION |
| Texto oscuro sobre CTA violeta | #0A0B0E / #AB8DFA | 7.42 | PASS_CALCULATION |
| Borde control / raised | #686E7A / #1C1F25 | 3.22 | PASS_CALCULATION |
| Crítico / destructivo default dark | #FF8F9A / #272025 | 7.31 | PASS_CALCULATION |
| Crítico / destructivo pressed dark | #FF8F9A / #4C3339 | 5.24 | PASS_CALCULATION |
| Borde decorativo / surface | #2A2D35 / #14161B | 1.31 | NON_TEXT_DECORATIVE_ONLY |
| Destructivo High contrast | #FF8F9A / #FFFFFF | 2.18 | FAIL_PENDING_IMPLEMENTATION_FIX |

ISSUE-HC-01: en Button Destructive Default 3:163, label 3:167 usa critical#FF8F9A. El modo High contrast 38:0 resuelve destructive-default205:912 a#FFFFFF, dando2,18:1 para texto14 px. Incidencia documentada, no corregida en Figma en3C por estar fuera de la autorización de documentación. Debe resolverse antes de ofrecer ese modo en implementación o mediante una corrección de diseño autorizada. El borde decorativo1,31:1 no debe emplearse como única señal del límite de un input. Los cálculos se basan en tokens sólidos, sin compositing; no sustituyen inspección de todos los controles y estados reales.

## 9. Interacciones y animaciones

manifests/motion.json y matriz-movimiento.csv diferencian lo configurado nativamente, lo representado por inicio/fin y lo solo documentado. Figma no reproduce literalmente Spotlight continuo, partículas, Count Up real o entradas por scroll. En producción, CSS/SVG es la primera opción para cambios simples. React Bits es un candidato opcional para los efectos de landing, no una dependencia obligatoria.

### M01 — HeroTitle

| Aspecto | Especificación |
| --- | --- |
| Disparador | initial load once |
| Estado inicial → final | three title groups not yet revealed → full legible H1 |
| Duración / easing | ~600 total; candidate 450/word +35 staggerms / cubic-bezier(0.22,1,0.36,1) |
| Candidato | Split Text optional; CSS word groups adequate |
| Móvil | Words/groups, not per-character cascade; no replay on back |
| Movimiento reducido | Full H1 immediately; same accessible text |
| Rendimiento | Low/medium: keep one semantic H1; avoid layout shifts |
| Evidencia Figma | Native three-group reference; 40 ms delay, 160 ms transition; real Split Text not simulated literally; 120:911 |

### M02 — Landing sections

| Aspecto | Especificación |
| --- | --- |
| Disparador | first viewport entry |
| Estado inicial → final | opacity0, small transform → visible |
| Duración / easing | 480; max30 stagger, ~570 groupms / ease-out |
| Candidato | Animated Content optional; CSS + IntersectionObserver enough |
| Móvil | Smaller displacement; content present if JS disabled |
| Movimiento reducido | Visible immediately |
| Rendimiento | Medium: observe once; no scroll-wide React rerenders |
| Evidencia Figma | Documented candidate; not continuous scroll simulation; 120:911 |

### M03 — QAMotorCard

| Aspecto | Especificación |
| --- | --- |
| Disparador | fine-pointer hover / keyboard focus |
| Estado inicial → final | rest → subtle violet highlight |
| Duración / easing | 180 ms / ease-out |
| Candidato | CSS surface/ring preferred; Spotlight Card optional on landing |
| Móvil | Static card; pressed/focus equivalent |
| Movimiento reducido | Instant emphasis; no tracking |
| Rendimiento | Low CSS; medium pointer effect. No layout animation |
| Evidencia Figma | Native Rest/Hover Smart Animate; 120:726 |

### M04 — Hero background

| Aspecto | Especificación |
| --- | --- |
| Disparador | optional fine pointer |
| Estado inicial → final | discrete static grid → localized response |
| Duración / easing | No mandatory loopms / ease-out |
| Candidato | Dot Grid optional, separate performance gate |
| Móvil | Static grid |
| Movimiento reducido | Static or omitted |
| Rendimiento | Medium/high: low density, pause hidden tab/offscreen; no dashboard use |
| Evidencia Figma | Documented candidate only; implementation optional; 120:911 |

### M05 — KPI

| Aspecto | Especificación |
| --- | --- |
| Disparador | first real data resolution |
| Estado inicial → final | placeholder → received value → final real count |
| Duración / easing | 400 ms / ease-out |
| Candidato | Count Up optional; conventional React/CSS number transition |
| Móvil | Same final value; no extra sequences |
| Movimiento reducido | Show final value; announce once |
| Rendimiento | Low: at most initial KPIs; no fake 0 value exposed as data |
| Evidencia Figma | Figma Stats Start/End uses 280 ms dissolve, not real counting; 147:937 |

### M06 — UsageMeter

| Aspecto | Especificación |
| --- | --- |
| Disparador | new real UsageSnapshot |
| Estado inicial → final | previous used ratio → new used ratio |
| Duración / easing | 300 ms / ease-out |
| Candidato | CSS width/transform; no React Bits needed |
| Móvil | Same numeric rules |
| Movimiento reducido | Immediate final width |
| Rendimiento | Low; no React state per animation frame |
| Evidencia Figma | Native isolated reference 300 ms Smart Animate; 3:294;147:937 |

### M07 — Buttons

| Aspecto | Especificación |
| --- | --- |
| Disparador | hover / pressed / focus / loading |
| Estado inicial → final | default → appropriate semantic state |
| Duración / easing | 180 hover;150 pressedms / ease-out |
| Candidato | CSS + conventional React async state |
| Móvil | Pressed/focus; no sticky hover |
| Movimiento reducido | Immediate state; loading label remains |
| Rendimiento | Low: keep minimum44 and prevent duplicate submit |
| Evidencia Figma | 24 native Style×State variants; 3:194 |

### M08 — Audit rows/cards

| Aspecto | Especificación |
| --- | --- |
| Disparador | hover/focus |
| Estado inicial → final | rest → surface highlight |
| Duración / easing | 180 ms / ease-out |
| Candidato | CSS |
| Móvil | AuditCard pressed/focus equivalent |
| Movimiento reducido | Instant highlight |
| Rendimiento | Low; no table movement or row shuffling |
| Evidencia Figma | Native rest/hover; 120:736;120:753 |

### M09 — PlanCard

| Aspecto | Especificación |
| --- | --- |
| Disparador | hover/focus/selection |
| Estado inicial → final | rest → emphasized/selected |
| Duración / easing | 180 ms / ease-out |
| Candidato | CSS; Pro recommendation remains independent of hover |
| Móvil | Pressed/focus, same selection |
| Movimiento reducido | Immediate emphasis |
| Rendimiento | Low; equal card heights and CTA baseline preserved |
| Evidencia Figma | Native three plan Rest/Hover variants; 3:336 |

### M10 — MobileNavDrawer

| Aspecto | Especificación |
| --- | --- |
| Disparador | menu click, close, Escape |
| Estado inicial → final | closed → open; background inert |
| Duración / easing | 240 ms / ease-out |
| Candidato | CSS transform/opacity + accessible React dialog |
| Móvil | 768/390/320; all routes available |
| Movimiento reducido | Open/close instant; focus management identical |
| Rendimiento | Low: do not animate width or block routing |
| Evidencia Figma | Documented E2 opening and close; keyboard behavior implementation requirement; 4:285;19:1871;145:14747;132:14145 |

### M11 — Content, tabs, checkout state

| Aspecto | Especificación |
| --- | --- |
| Disparador | navigation or actual state change |
| Estado inicial → final | previous content → next content |
| Duración / easing | 280 ms / ease-out |
| Candidato | CSS fade/state switch; React tabs |
| Móvil | Same actions, no blocking delay |
| Movimiento reducido | Immediate state and appropriate focus |
| Rendimiento | Low; no exit transition that delays error recovery |
| Evidencia Figma | Native content references use 280 ms dissolve; 147:937;4:285 |

### M12 — AuditLoader

| Aspecto | Especificación |
| --- | --- |
| Disparador | actual pending/processing |
| Estado inicial → final | indeterminate phase A → phase B/C until backend terminal |
| Duración / easing | 600 step;300 opacityms / ease-out |
| Candidato | CSS indeterminate dots; React controls actual status |
| Móvil | Same text; no fake percentage |
| Movimiento reducido | Static status text + dots; no loop |
| Rendimiento | Low; stop/unmount on terminal/hidden as appropriate |
| Evidencia Figma | Native AFTER_TIMEOUT600 and Smart Animate300; timers never complete an audit; 120:851 |

### M13 — Findings/recommendations

| Aspecto | Especificación |
| --- | --- |
| Disparador | real report loaded |
| Estado inicial → final | hidden visual presentation → readable report |
| Duración / easing | 280–320; proposed detail not a measured Figma tokenms / ease-out |
| Candidato | CSS brief fade if useful; conventional React |
| Móvil | Minimal/instant if long report |
| Movimiento reducido | Immediate report |
| Rendimiento | Low; do not stagger hundreds of findings; searchable content available immediately |
| Evidencia Figma | E2 progressive result behavior documented; proposed detailed duration; 19:929;19:979 |

### M14 — R2/C3 brand entrance

| Aspecto | Especificación |
| --- | --- |
| Disparador | landing first load once |
| Estado inicial → final | L, lanes not revealed → L + lane1 + lane2 |
| Duración / easing | 480 ms / cubic-bezier(0.22,1,0.36,1) |
| Candidato | Original SVG paths + CSS; React only triggers |
| Móvil | Same; no mouse dependence |
| Movimiento reducido | Full symbol static at0 ms |
| Rendimiento | Low: opacity/transform3 paths, no filters/particles |
| Evidencia Figma | Storyboard: L0, lane1 120, lane2 240; W3 remains legible; 401:68 |

### M15 — BrandLogo hover

| Aspecto | Especificación |
| --- | --- |
| Disparador | fine pointer hover |
| Estado inicial → final | rest → scale max1.015 |
| Duración / easing | 180 ms / ease-out |
| Candidato | SVG/CSS |
| Móvil | Static logo; focus/pressed belongs to link |
| Movimiento reducido | No scale; static emphasis |
| Rendimiento | Low: preserve hit area and SVG aspect ratio |
| Evidencia Figma | Documented proposal; functional screen logo remains static; 401:68 |

### M16 — Brand loading / header

| Aspecto | Especificación |
| --- | --- |
| Disparador | real pending or state/navigation |
| Estado inicial → final | brand static → brand static + appropriate status/header emphasis |
| Duración / easing | 180 ms / ease-out |
| Candidato | Static SVG + CSS opacity; existing loader |
| Móvil | Same stable geometry |
| Movimiento reducido | Immediate emphasis, static label |
| Rendimiento | Low; no decorative dashboard loop |
| Evidencia Figma | Loading uses AuditLoader; brand never claims progress percentage; 401:68 |

### M17 — Accordion

| Aspecto | Especificación |
| --- | --- |
| Disparador | click or Enter/Space |
| Estado inicial → final | closed → open |
| Duración / easing | 150 ms / ease-out |
| Candidato | Conventional React disclosure + CSS fade |
| Móvil | Same disclosure; no hover dependency |
| Movimiento reducido | Immediate open/close |
| Rendimiento | Low; aria-expanded and content readability take priority |
| Evidencia Figma | Native150 ms dissolve; 3:421 |

La entrada de marca usa los tres paths originales: L al inicio, diagonal1 a120 ms y diagonal2 a240 ms, final a480 ms. W3 permanece legible. No mover los paths respecto a la geometría final ni hacer morph a otro símbolo. El loader responde a una operación pendiente real; no necesita una marca en bucle. Los efectos elaborados quedan en landing y deben poder desactivarse sin afectar contenido.

Licencia candidata React Bits: el upstream consultado declara MIT + Commons Clause, con restricciones a revender/redistribuir los componentes por sí mismos. Revisar el archivo de licencia de la versión concreta elegida y sus dependencias antes de instalar; no tratarla como MIT puro. No se adjunta código React Bits ni se implementa en esta entrega.

## 10. Estados funcionales y reglas de negocio

### 10.1. Cuota, porcentajes y periodos

| Plan | Cuota aprobada | Retención | Renovación |
| --- | --- | --- | --- |
| Free | 3 auditorías exitosas únicas | 7d en prototipo/brief como política sugerida a confirmar | Sin renovación automática ni mensual |
| Starter | 10 auditorías/mes | 7d | Periodo mensual definido por backend |
| Pro | 100 auditorías/mes | 90d | Periodo mensual definido por backend |
| Power | 500 auditorías/mes | 180d | Periodo mensual definido por backend |

Todos los planes incluyen los cuatro motores. No se inventan precios, impuestos, descuentos, ventajas o certificaciones. La concurrencia base de1 procede del brief; Power 2 queda condicionado a pruebas de carga y confirmación del backend, no debe anunciarse como ventaja disponible.

Consumo = auditorías completadas exitosamente en el pool vigente. Porcentaje utilizado =100×used/limit. La barra usa ese ratio, no available/limit. Disponible procede del servidor; si se adopta reserva atómica, available=limit−used−reserved, por lo que no siempre será simplemente limit−used durante un análisis. Las reservas no se suman a used antes de completarse. Refrescar el snapshot al crear/recuperar/completar/fallar, activar plan o cambiar periodo.

El ratio real decide el tono:0–<50 normal,50–<80 moderado,80–100 cercano/agotado. Evitar redondear79,95 a80 visualmente y mantenerlo naranja; presentar precisión suficiente o aplicar una regla acordada consistente. Nunca negativo, NaN o división por cero: si no existe un snapshot válido, mostrar carga/error/dato no disponible en lugar de un0 ficticio.0% significa barra vacía, no una franja mínima decorativa.

Free y pagado son pools diferentes. Comprar Starter otorga la cuota Starter confirmada, no 13 créditos por sumar Free; análogo para Pro/Power. Renovación, zona horaria, retención y cancelación se reciben del backend. Las fechas de Figma son ejemplos; no hardcodearlas ni resetear por reloj/localStorage. Una cancelación programada mantiene acceso hasta fin de periodo, según el diálogo aprobado. La política posterior de acceso a Free remanente, prorrateo y cambio de plan requiere decisión explícita.

### 10.2. Tabla de transiciones

Cada fila es una regla de implementación pendiente de prueba real. La columna de autoridad señala quién puede decidir el estado; el cliente solo refleja el resultado y gestiona la interacción transitoria.

#### auth

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| guest | submit sign-in; Clerk accepts method | authenticating | Disable duplicate submission, preserve form and show loading. Autoridad: Clerk |
| authenticating | verification required; Clerk response | email_verification | Show supplied challenge; no own email token logic. Autoridad: Clerk |
| authenticating | second factor required; Clerk tenant enables MFA | mfa | Render Clerk challenge and recovery path. Autoridad: Clerk |
| guest | recover access; Supported Clerk flow | reset | Follow provider challenge; generic error to avoid identity enumeration. Autoridad: Clerk |
| authenticating | valid session; Verified session | authenticated | Use allowlisted local returnTo or /app; invalidate previous user caches. Autoridad: Clerk+backend |
| authenticating | invalid credentials / retry limit; Provider response | recoverable_error | Inline explanation; retry or respect retryAfter; never reveal secrets. Autoridad: Clerk |
| authenticated | session expires or logout; Real session | guest | Clear sensitive UI cache, route to sign-in, preserve safe return path. Autoridad: Clerk+backend |

#### upload

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| empty | choose/drop file; User gesture | validating | Check format, byte size, parse JSON; do not run workflow. Autoridad: client advisory + backend authoritative |
| validating | file exceeds limit; > 1 MiB design limit; server must confirm actual | invalid_413 | Explain size; enable choose another file; no request/credit consumed. Autoridad: backend enforces |
| validating | unsupported format; Unsupported effective JSON input contract | invalid_415 | Keep module, show recovery; extension/MIME alone is insufficient security. Autoridad: backend enforces |
| validating | malformed JSON/schema; Parse/schema fails | invalid_422 | Show safe location/help, preserve selected metadata; no raw secrets in error. Autoridad: backend enforces |
| validating | valid file + chosen supported n8n profile; Actual profile catalog validates | ready | Show file metadata, limits and audit action. Autoridad: backend revalidates |
| ready | start audit; Authenticated; active entitlement has available slot | submitting | Create one idempotency key for this logical attempt, preserve on retry; disable duplicate click. Autoridad: backend |
| submitting | HTTP accepted/working; Only if actual API reports asynchronous work | processing | Show indeterminate status. No invented percentage or timer-to-success. Autoridad: backend status; async capability pending |
| submitting | synchronous completed response; Actual POST response validated | completed | Navigate to actual audit ID/report when contract supports it; refresh usage. Autoridad: existing POST contract to verify |
| submitting or processing | network timeout; Outcome unknown | unknown_outcome | Keep same key; recover real status before retrying creation; no blind refund/new audit. Autoridad: backend idempotency lookup pending |
| ready or submitting | technical rate limit; Real retry limit, not quota | rate_limited_429 | Explain temporary wait; honor backend retryAfter if provided; preserve file. Autoridad: backend |

#### audit

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| pending/accepted | execution starts; Backend sends transition | processing | Show status label, disable create duplication; keep navigation usable. Autoridad: backend; no local fake timers |
| processing | analysis completes; Terminal completed result | completed | Commit exactly one successful consumption; expose sanitized report; refresh all quota views. Autoridad: backend transaction |
| pending or processing | terminal failure; Backend confirms failure | failed | Release reservation once, consume zero; recovery does not manufacture a new successful report. Autoridad: backend transaction |

#### idempotency

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| submitting | recover existing request; Same actor/key and matching payload | existing_processing | Informative state: open existing progress, no duplicate consumption. Autoridad: backend |
| submitting | recover completed request; Same actor/key and matching payload | existing_completed | Open existing result, same audit ID; count unchanged. Autoridad: backend |
| submitting | key reused with different payload; Server detects conflict | conflict | Explain a different attempt is required after user confirmation; never overwrite existing audit. Autoridad: backend; exact response code/contract pending |

#### report

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| completed | apply engine/severity/node/text filters; Valid filter values | filtered | Filter consistently, show visible result count; totals remain clearly labeled. Autoridad: backend result + client view |
| filtered | no matches; Intersection empty | no_results | Show reset controls, keep selected criteria visible. Autoridad: view state |
| completed or filtered | open finding; User owns unexpired report | finding_detail | Dialog/drawer with safe evidence, recommendation and keyboard dismissal. Autoridad: backend owner + view state |
| completed | retention expires; now >= backend expiresAt | expired_410 | Hide report payload; retain allowed metadata only; provide history/new audit recovery. Autoridad: backend |
| any | access another actor report; Identity lacks ownership | denied | Do not disclose report data; backend may use 404 anti-enumeration policy, decision pending. Autoridad: backend |

#### trial

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| not_eligible_or_not_created | first verified eligible account; Server grants unique benefit once | available_3 | Three successful audits total, no card, no monthly reset. Autoridad: backend persistence |
| available | third successful audit; Lifetime consumed = 3 | exhausted_free | Disable new audit; Explorar planes recovery; no renewal date. Autoridad: backend |

#### usage

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| available | request accepted; Atomic quota/concurrency admission | reserved | Reserve slot; availability excludes in-flight reservations; success consumption separate. Autoridad: backend transaction |
| reserved | completed; Terminal transition exactly once | consumed | Commit one; all dashboard/sidebar/plan share the same fresh snapshot. Autoridad: backend transaction |
| reserved | confirmed failure/cancel before billable result; Server terminal policy | released | Release once; final consumption zero. Client timeout alone is insufficient. Autoridad: backend transaction |
| normal | used / limit reaches 50%; Raw ratio >= .5 and < .8 | moderate | Orange + text; bar width uses used, not remaining. Autoridad: backend counts |
| normal or moderate | used / limit reaches 80%; Raw ratio >= .8 | near_limit | Red + text + non-intrusive contextual notice; do not interrupt work. Autoridad: backend counts |

#### paid_quota

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| available | monthly successful usage reaches limit; 10 / 100 / 500 respectively | exhausted_paid | Disable new audit; show real renewal date and Explorar planes. Autoridad: backend |
| exhausted_paid | new billing period; Server confirms next entitlement period | available_paid | Refresh plan-specific quota; never reset by browser clock or local storage. Autoridad: backend |

#### subscription

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| free or active | select Starter/Pro/Power; Compare catalog from server | checkout_intent | Preserve selected plan; current plan and active quota stay unchanged. Autoridad: view state + backend catalog |
| active | confirm cancellation; Effective date displayed and server accepts | cancel_scheduled | Keep active until current period end; show exact date/timezone from server. Autoridad: backend |
| cancel_scheduled | period ends; Backend confirms expiration | inactive | Refresh access and report retention per final policy. Free fallback, proration and upgrades remain decisions, not client rules. Autoridad: backend policy pending |

#### payment

| Inicial | Evento / condición | Final | Efecto y autoridad |
| --- | --- | --- | --- |
| checkout_intent | continue checkout; Actual provider session available | pending | Backend creates attempt; browser redirect is informational. Prototype is simulation only. Autoridad: backend; provider future |
| pending | redirect return; Attempt belongs to current actor | verifying | Query server status; do not trust success querystring or local variables. Autoridad: backend |
| pending/verifying | signed payment confirmed; Idempotent server event, correct plan/amount/currency | confirmed | Activate entitlement once; update same usage snapshot across app. Free credits remain separate. Autoridad: backend + future verified provider webhook |
| pending/verifying | declined or cancelled; Server confirms outcome | failed_or_cancelled | Keep old entitlement; allow safe retry/return to comparator; no charge simulation in production. Autoridad: backend |

### 10.3. Errores, recuperación y límites

413/415/422 permanecen dentro de importación; el usuario elige otro archivo o corrige el JSON.429 comunica un límite técnico temporal y respeta Retry-After si la API lo define; agotamiento de cuota es un estado comercial separado. La recuperación idempotente de una solicitud en proceso/completada es informativa, aunque el prototipo la etiquete409; conciliar su código y envelope real con FastAPI. Un409 por misma clave con payload distinto sí representa conflicto, no un resultado recuperable.

403/404/500/502/503 tienen número, icono, título, explicación y acciones centradas en el área útil, debajo del mensaje.410 indica expiración real del informe propio; no recuperar evidencia desde caché una vez denegada por el servidor. Timeout/offline no demuestra que el backend falló: mantener el intento y recuperar su estado antes de crear otro. No consumir crédito al seleccionar/validar un archivo, al consultar progreso, al filtrar, al abrir un informe o al repetir la misma solicitud idempotente.

## 11. Contratos de datos y API

### 11.1. Operaciones existentes reportadas

| Método / ruta | Evidencia | Pendiente antes de integrar |
| --- | --- | --- |
| GET /health | User says development FastAPI exists. No live request/OpenAPI inspection in 3C. | No schema asserted. Read exact service health schema in OpenAPI before integration. To verify; never expose internal diagnostics in public UI. |
| POST /api/v1/audits | User report only; endpoint implementation and wire schema uninspected. | Content-Type/body/envelope/file transport/n8n profile/idempotency mechanism to confirm with OpenAPI and backend owner. Synchronous report vs asynchronous job/IDs/status/error fields and status codes to confirm. Clerk verification, ownership, quotas and idempotency support must be confirmed, not assumed from route existence. |

La existencia de POST /api/v1/audits no demuestra que ya persista informes, controle cuotas, valide Clerk o recupere idempotencia. No se inventa un contrato request/response como si estuviera implementado. Primero obtener OpenAPI actual, ejemplos sanitizados reales y semántica de errores. Definir entonces el adaptador y tests de contrato. El UI no mostrará queued ni consultará un endpoint de estado hasta que el backend lo soporte; una respuesta síncrona se presenta con loading indeterminado hasta recibir el resultado real.

### 11.2. Operaciones adicionales propuestas / futuras

| ID | Método / ruta propuesta | Estado | Necesidad |
| --- | --- | --- | --- |
| viewer | GET /api/v1/me | PROPOSED_NOT_IMPLEMENTED | Authenticated app identity, preferences and entitlements summary. |
| usage | GET /api/v1/me/usage | PROPOSED_NOT_IMPLEMENTED | Single authoritative UsageSnapshot across Dashboard, sidebar and Mi plan. |
| listAudits | GET /api/v1/audits | PROPOSED_NOT_IMPLEMENTED | Owned paginated list; allowlisted search/severity/date/n8n profile filters. |
| auditStatus | GET /api/v1/audits/{id} | PROPOSED_NOT_IMPLEMENTED | Owned status and safe metadata; can also return result in one envelope if agreed. |
| report | GET /api/v1/audits/{id}/report | PROPOSED_NOT_IMPLEMENTED | Owned unexpired sanitized report; consider combining with auditStatus to avoid duplicate contracts. |
| recoverAttempt | GET /api/v1/audit-attempts/{key} | PROPOSED_NOT_IMPLEMENTED | Recover same authenticated logical attempt; key must be opaque/scoped, non-cacheable; alternative existing POST replay contract. |
| plans | GET /api/v1/plans | PROPOSED_NOT_IMPLEMENTED | Actual catalog, entitlements, public prices if approved; no invented amounts. |
| subscription | GET /api/v1/subscriptions/current | PROPOSED_NOT_IMPLEMENTED | Current status, quota pool, period start/end, cancellation and renewal. |
| billingAttempt | GET /api/v1/billing/attempts/{id} | PROPOSED_NOT_IMPLEMENTED | Owned authoritative payment status; supports safe result page. |
| preferences | PATCH /api/v1/me/preferences | PROPOSED_NOT_IMPLEMENTED | Only non-identity app preferences; Clerk owns identity. |
| deleteAudit | DELETE /api/v1/audits/{id} | PROPOSED_NOT_IMPLEMENTED | Existing prototype delete confirmation: owner-enforced deletion, policy/audit trail and retention contract to approve. |
| accountDeletion | POST /api/v1/me/deletion-requests | PROPOSED_NOT_IMPLEMENTED | Existing prototype account deletion request; privacy and Clerk lifecycle orchestration require explicit contract. |
| checkout | POST /api/v1/billing/checkout | FUTURE_PROVIDER_INTEGRATION | Create provider checkout session for selected catalog plan. |
| cancelSubscription | POST /api/v1/subscriptions/cancel | FUTURE_PROVIDER_INTEGRATION | Schedule cancellation at backend-confirmed period end. |
| paymentWebhook | POST /api/v1/billing/webhooks/{provider} | FUTURE_PROVIDER_INTEGRATION | Server-only verified and idempotent provider event handler; browser must not call it. |

Las rutas de esta tabla son propuestas técnicas de API, no nuevas rutas del frontend aprobadas ni endpoints disponibles. Pueden fusionarse o renombrarse al conciliar el backend: status y report pueden compartir envelope; recuperación puede ser replay seguro del POST existente si ese contrato ya está soportado. Evitar implementar variantes redundantes. El webhook es server-to-server y el navegador nunca lo llama. Las acciones de eliminación/preferencias del prototipo permanecen deshabilitadas por capacidad real hasta aprobar sus contratos; no afirmar persistencia tras un toast simulado.

### 11.3. DTO de dominio propuestos

Estos modelos ayudan a desacoplar UI del wire format. No son OpenAPI publicado ni nombres de campos confirmados de FastAPI. Solo el adaptador traduce el contrato real a este dominio después de acordarlo.

#### Viewer

| Campo propuesto | Significado / restricción |
| --- | --- |
| id | opaque internal id if needed; never authority from client |
| displayName | safe user display |
| entitlement | current server-selected pool, not local boolean |

#### UsageSnapshot

| Campo propuesto | Significado / restricción |
| --- | --- |
| planCode | free&#124;starter&#124;pro&#124;power (backend mapping to agree) |
| poolId | opaque entitlement/period identifier |
| limit | 3&#124;10&#124;100&#124;500 as eligible |
| used | integer successful consumptions in this pool |
| reserved | integer accepted in-flight reservations, optional only if backend supports them |
| available | authoritative integer; under proposed reservation policy limit-used-reserved |
| periodStart | ISO8601 or null for lifetime Free |
| periodEnd | ISO8601 or null for lifetime Free |
| renewsAt | ISO8601&#124;null; null for Free |
| cancelAtPeriodEnd | boolean |
| retentionDays | server policy |
| version | monotonic snapshot/revision proposal to reject stale overwrite |
| updatedAt | ISO8601 server timestamp |

#### AuditSummary

| Campo propuesto | Significado / restricción |
| --- | --- |
| id | opaque audit id |
| name | safe display name |
| createdAt | ISO8601 UTC |
| status | actual backend enum to map, not guessed |
| n8nProfile | actual supported profile identifier |
| nodeCount | validated integer |
| criticalCount | real analysis aggregate |
| expiresAt | ISO8601&#124;null |

#### AuditResult

| Campo propuesto | Significado / restricción |
| --- | --- |
| audit | AuditSummary |
| engineVersion | real audit engine version |
| engines | four actual category results |
| findings | Finding[] sanitized |
| summary | real aggregate counts, no invented certification/score |
| expiresAt | enforced server timestamp |

#### Finding

| Campo propuesto | Significado / restricción |
| --- | --- |
| id | stable within audit |
| engine | mapped actual enum |
| severity | backend enum mapped to badges |
| ruleId | actual rule identifier |
| title | plain safe text |
| nodeId | safe reference, nullable |
| evidence | sanitized structured text, never raw credentials or executable HTML |
| recommendation | plain text/safely rendered markdown policy to agree |

#### AuditAttempt

| Campo propuesto | Significado / restricción |
| --- | --- |
| key | opaque per-logical-attempt key |
| auditId | existing owned result id |
| status | pending&#124;processing&#124;completed&#124;failed mapped from actual backend |
| replayed | informational boolean proposal |

#### Plan

| Campo propuesto | Significado / restricción |
| --- | --- |
| code | starter&#124;pro&#124;power |
| monthlyAudits | 10&#124;100&#124;500 |
| retentionDays | 7&#124;90&#124;180 |
| engines | all four, identical inclusion |
| price | nullable; minor units/currency/period only after approval and actual catalog; do not assume zero |

#### PaymentAttempt

| Campo propuesto | Significado / restricción |
| --- | --- |
| id | opaque owned attempt |
| status | pending&#124;confirmed&#124;failed&#124;cancelled (wire enum pending) |
| planCode | selected code, never authority for active plan |
| subscriptionId | only real confirmed subscription |
| returnPath | allowlisted local target |

#### ErrorEnvelope

| Campo propuesto | Significado / restricción |
| --- | --- |
| code | stable machine code proposed, not derived from arbitrary translated text |
| message | safe user description |
| fieldErrors | safe field-level details if applicable |
| requestId | opaque trace correlation |
| retryAfterSeconds | optional backend advisory |
| existingAuditId | only authorized idempotent recovery; no third-party ids |

Los filtros deben acordar enums reales de severidad/motores, fechas inclusivas/exclusivas y zona horaria, orden estable, cursor/paginación y búsqueda. Las cuatro categorías visibles se mapean a enums internos, nunca se asume que su texto español sea una clave de API. Los IDs son opacos; no derivar ownership del prefijo o secuencia. ErrorEnvelope solo contiene mensajes y correlación seguros, nunca stack trace, consulta SQL, URL privada completa o evidencia sensible.

## 12. Arquitectura de integración y seguridad

La arquitectura prevista mantiene Next.js como aplicación web, Clerk como identidad, FastAPI como autoridad de auditorías, Supabase/PostgreSQL como persistencia/cuotas y Sentry como observabilidad. El repositorio, esquema real de base de datos y configuración de SDK no se inspeccionaron en3C. No se escribe DDL, políticasRLS, funciones, migraciones o código de servicio en este paquete.

### 12.1. Transporte autenticado propuesto

Recomendación para evaluar: adaptador servidor/BFF de Next.js obtiene/verifica la sesión Clerk, usa un token corto para el destinatario acordado y llama FastAPI. FastAPI vuelve a verificar identidad y autorización. Esto permite mantener direcciones/configuración interna en servidor, pero no sustituye la autorización backend. Alternativa válida a aprobar: navegador→FastAPI directamente con token corto, orígenesCORS precisos y verificaciónJWT completa. No implementar ambos caminos por inercia ni hardcodear una plantilla JWT no configurada.

Validar firma con JWKS/issuer correctos, expiración, not-before, audience cuando esté configurado y azp/orígenes autorizados según el flujo Clerk. No confiar en user_id enviado por el cliente. Verificación de sesión en un guard de rutas no basta para proteger consultas o mutaciones. Si se usan cookies en rutas BFF mutables, definir controles de origen/CSRF, misma sesión y no aceptar acciones desde orígenes arbitrarios. CORS no autentica ni autoriza y no debe usar wildcard con credenciales.

Las variables públicas solo contienen configuración apta para navegador: origen público o publishable key cuando el SDK la requiere. Secretos Clerk, Supabase service-role, claves de firma/pago, tokens Sentry de publicación y secretos de servidor permanecen solo en servidor/CI, nunca NEXT_PUBLIC, HTML serializado, localStorage, documentación o capturas. Este handoff no contiene valores de credenciales.

### 12.2. Propiedad, caché y persistencia

Cada lista, informe, recuperación de intento, suscripción y pago se limita al sujeto autenticado. Si FastAPI usa una credencial privilegiada que evitaRLS, deberá aplicar ownership explícitamente; no asumir que la infraestructura lo hará por sí sola. Las reservas, consumos y beneficioFree requieren transacciones/constraints durables y unicidad por intento/evento, no booleanos de React.

Usar una sola lectura compartida de UsageSnapshot por sujeto y periodo. Aislar claves de caché y limpiar al cerrar/cambiar cuenta; evitar respuestas antiguas que sobreescriban un periodo o plan nuevo. Datos privados no deben almacenarse en caché pública compartida ni aparecer en metadatos sociales. Los headers, caché de Server Components, navegaciones atrás y estado persistido deben probarse en la versión de Next.js escogida, sin asumir defaults temporales de otra versión.

No almacenar el JSON original por defecto. Para ejecución síncrona puede permanecer transitoriamente en la petición; si se adopta un proceso asíncrono con objeto privado temporal, definir TTL, cifrado/acceso y borrado real. No prometer borrado inmediato de respaldos. UI no ejecuta el workflow n8n, evalúa código del archivo ni muestra evidencia sin sanitizar.

### 12.3. Pagos y observabilidad

El backend crea intentos y aplica únicamente eventos verificados/idempotentes de la futura pasarela. Correlacionar intento, usuario, plan, importe/moneda reales y evento; manejar duplicados y orden. Volver con success=true no concede acceso. La cancelación muestra la fecha efectiva antes de confirmar; backend decide estado y vigencia. Hasta que existan contratos/pasarela, comparación y mensajes pueden implementarse como lectura; no simular una compra real en producción.

Propuesta Sentry a validar con el SDK elegido: errores técnicos con requestId y contexto mínimo de versión/operación; excluir workflowJSON, evidencia, credenciales, cabecerasAuthorization, tokens y datos de pago de eventos, breadcrumbs, traces y replay. PII/replay requieren política explícita. No se configuró ni probó Sentry en3C; revisar documentación y defaults del SDK concreto durante implementación.

## 13. QA y criterios de aceptación

La matriz completa tiene61 casos. Todas las pruebas del frontend real están NOT_RUN_FRONTEND_NOT_IMPLEMENTED. Un mock que devuelve success valida la UI, no prueba Clerk, cuotas, pagos ni ownership. Las comprobaciones realizadas en3C corresponden a extracción, enlaces de referencia, integridad de recursos/documentación y conservación del archivo. No confundirlas con QA de producción.

### 13.1. Tipos de evidencia

| Nivel | Qué demuestra | Qué no demuestra |
| --- | --- | --- |
| Figma Present, aceptación del usuario3B | Marca y recorridos que el usuario revisó en el prototipo. | Endpoint real, cuota atómica, pago o autenticación efectiva. |
| Nativo Figma3C | IDs, variantes, medidas, destinos y estructura; renders de guías nuevas. | Ejecución del SaaS ni validez de todos los caminos de negocio. |
| Unit/component con fixtures futuras | Cálculo/presentación/semántica para entradas conocidas. | Persistencia, permisos o integración real. |
| Contrato/integración futura | Esquema real, autorización, idempotencia y cuota con backend de prueba autorizado. | Aceptación de diseño sin revisión responsive. |
| E2E/manual futura | Recorrido completo con servicios reales/sandbox más teclado, zoom y lector. | Certificación formal WCAG o despliegue autorizado. |

### 13.2. Fixtures de consumo obligatorias

| Plan / used / reserved | Disponible | Porcentaje y barra | Tono / aviso |
| --- | --- | --- | --- |
| Pro 100 /0 /0 | 100 | 0% /0% | Normal verde; sin relleno |
| Pro 100 /33 /0 | 67 | 33% /33% | Normal verde |
| Pro 100 /49 /0 | 51 | 49% /49% | Normal verde |
| Pro 100 /50 /0 | 50 | 50% /50% | Moderado naranja |
| Pro 100 /79 /0 | 21 | 79% /79% | Moderado naranja |
| Pro 100 /80 /0 | 20 | 80% /80% | Rojo; aviso contextual no intrusivo |
| Pro 100 /100 /0 | 0 | 100% /100% | Agotado; fecha real + Explorar planes |
| Free 3 /1 /0 | 2 | ≈33,3% /33,333% | Pool Free separado; no renovación |
| Power 500 /1 /0 | 499 | 0,2% /0,2% | No redondear a0 de forma engañosa |
| Starter 10 /0 /1 | 9 | 0% usado /0% | Una reserva no es aún consumo exitoso; snapshot servidor |

### 13.3. Matriz completa

| ID / área | Escenario | Resultado esperado | Prueba / dependencia |
| --- | --- | --- | --- |
| QA01 / Navegación | Abrir las 18 rutas principales y recargar URLs privadas | URLs aprobadas; retorno seguro a sign-in si falta sesión; sin rutas nuevas inventadas. | E2E + manual; Frontend implementado |
| QA02 / Navegación | Mi plan, Explorar planes y Precios públicos | /app/plan muestra estado actual; /app/planes abre comparador directamente; /precios público. Sin scroll forzado desde Mi plan. | E2E + manual; Frontend implementado |
| QA03 / Navegación | Abrir y cerrar drawer; navegar con enlace activo | Mismas funciones que desktop; menú se cierra al navegar; no acceso a un usuario anterior. | E2E + manual; Frontend implementado |
| QA04 / Marca | Comparar logos con SVG originales | R2/C3 + W3; K/L personalizadas; sin estirar, W1/W2 ni n8n QA como marca; n8n descriptivo permanece. | Visual snapshots + manual; Frontend implementado |
| QA05 / Responsive | Cuatro viewports y anchos intermedios | Sin overflow de página, clipping o solapamientos; scroll vertical, tarjetas y texto completos. | Visual regression + bounding-box assertions; Frontend implementado |
| QA06 / Responsive | Botones 413/415/422/idempotencia a390 | Texto de recuperación usa ancho disponible; no ancho fijo66; min44 de alto, padding12–16, legible y clicable. | Visual + computed layout + E2E; Frontend implementado |
| QA07 / Responsive | Mismos estados a320 y 200% zoom | Sin fragmentación vertical ni recorte; altura crece si hay wrap; no agrandar viewport para ocultar defecto. | Visual + manual; Frontend implementado |
| QA08 / Responsive | Controles de simulación de errores | Solo en harness/demo identificado; no forman parte de UI de producción ni envían auditorías reales. | E2E + manual; Frontend implementado |
| QA09 / Accesibilidad | Recorrer por teclado todos los controles | Orden lógico, foco visible2 px, skip link previsto, sin trampas excepto modal abierto. | Manual keyboard + component tests; Frontend implementado |
| QA10 / Accesibilidad | Dialog/drawer: abrir, tabular, Escape, cerrar | Foco inicial útil, background inert, focus trap, Escape apropiado y retorno al disparador. | Component + E2E + manual; Frontend implementado |
| QA11 / Accesibilidad | Labels, errores y lector de pantalla | Labels persistentes, aria-describedby, error asociado, encabezados semánticos, iconos decorativos ocultos. | axe + manual screen reader; Frontend implementado |
| QA12 / Accesibilidad | Contraste de todos los estados, incluido alto contraste | Text4.5:1 / large3:1; controles y foco3:1; revisar contraste destructivo HC detectado antes de activar ese modo. | Contrast calculation + visual/DOM checks; Frontend implementado |
| QA13 / Accesibilidad | Áreas táctiles, textos largos, nombres de archivo | Objetivo producto44 px; ninguna información depende solo del color; nombres rompen dentro del contenedor. | Component + manual touch; Frontend implementado |
| QA14 / Movimiento | prefers-reduced-motion y navegación atrás | Sin stagger, escala o loops; contenido final visible; foco y estado no dependen de animación. | E2E emulated preference + manual; Frontend implementado |
| QA15 / Autenticación | Registro, verificación, login, reset y MFA | Clerk gestiona desafíos reales; fallback accesible; no formularios de contraseña simulados ni endpoints propios inventados. | E2E + manual; Tenant/configuración Clerk confirmados |
| QA16 / Autenticación | Token inválido/expirado/issuer o azp incorrectos | Rechazo de servidor; sin datos privados en HTML/cache ni sesión por localStorage. | Integration security + E2E; Clerk + verificación JWT FastAPI |
| QA17 / Autenticación | Logout y cambio de cuenta | Invalidar datos privados y claves de caché por usuario; no mostrar informe/cuota anterior. | E2E + manual; Clerk + API propia |
| QA18 / Upload | JSON válido bajo límites con perfil soportado | Metadata correcta; seleccionar archivo no consume; inicio hace un solo intento. | Component + integration; Frontend implementado |
| QA19 / Upload | Archivo >1 MiB, exactamente límite y vacío | Mensaje 413/contextual seguro o validación aplicable; servidor revalida bytes; no consumir. | Unit + API integration + E2E; Límite real API confirmado |
| QA20 / Upload | Extensión/MIME engañosos y JSON corrupto | 415 o error de contenido según contrato; no confiar solo en extensión/MIME; elegir otro archivo funciona. | Unit + API integration; Frontend implementado |
| QA21 / Upload | JSON sintáctico válido pero esquema inválido | 422 con detalle seguro y ubicación útil; no ejecutar JS, HTML o workflow. | API integration + component; Frontend implementado |
| QA22 / Upload | 150/151 nodos y2000/2001 conexiones; perfil no soportado | Límites confirmados y aplicados en servidor; mensaje contextual; sin cobro ni falsos perfiles compatibles. | Unit + API integration; OpenAPI y perfiles reales |
| QA23 / Auditoría | Doble clic y envío repetido durante carga | Un intento lógico, una clave; botón loading/disabled; no dos consumos. | Component + integration concurrency; Frontend implementado |
| QA24 / Auditoría | Respuesta síncrona frente a trabajo asíncrono | Adaptador sigue el contrato real; no inventar queued, porcentajes o finalización por temporizador. | Contract + E2E; POST real y política async |
| QA25 / Auditoría | Completar análisis y volver al dashboard | Mismo ID real/informe; consumo+1 solo una vez; sidebar, dashboard y Mi plan sincronizados. | API integration + E2E; Frontend implementado |
| QA26 / Auditoría | Fallo terminal y reserva | Consumo0; liberación idempotente de reserva; permite recuperación correcta. | API transaction integration; Backend quota ledger |
| QA27 / Idempotencia | Repetir misma clave y payload en proceso | Mostrar recuperación informativa; Ver progreso existente apunta al mismo intento. | API integration + E2E; Frontend implementado |
| QA28 / Idempotencia | Repetir misma clave y payload completado | Ver resultado existente abre mismo ID; consumo no cambia. | API integration + E2E; Frontend implementado |
| QA29 / Idempotencia | Misma clave, otro payload o usuario | Conflicto/rechazo seguro; no sobrescribir ni recuperar un informe ajeno. | API security integration; Backend idempotency enforcement |
| QA30 / Recuperación | Timeout con resultado desconocido | Conservar intento/archivo seguro, consultar estado; no reenviar con nueva clave ni devolver cuota a ciegas. | Integration + E2E; Frontend implementado |
| QA31 / Recuperación | 429 técnico con retryAfter | Aviso temporal, preservar actividad, esperar plazo; no confundir con Free agotado o plan mensual agotado. | Contract + component + E2E; Frontend implementado |
| QA32 / Free | Elegibilidad y completar tres auditorías | 3 únicas de por vida; solo completadas consumen; registro/login/recarga no reinician beneficio. | API integration; Backend persisted trial eligibility |
| QA33 / Free | Cuota Free agotada en desktop y móvil | Nueva auditoría disabled, sin destino Mi plan; Explorar planes activo; sin renovación mensual ficticia. | E2E + visual; Frontend implementado |
| QA34 / Cuota | Primer uso Free 1/3, Starter 1/10, Pro 1/100, Power 1/500 | Porcentajes33.3%,10%,1%,0.2%; restante2,9,99,499; barras coherentes. | Unit + component + integration; Frontend implementado |
| QA-U000 / UsageMeter | Pro de100 con 0 usadas,0 reservadas | 0% de cuota utilizada; 100 disponibles; barra0%; verde; etiqueta semántica, no solo color | Unit + component visual + integration; Frontend implementado |
| QA-U033 / UsageMeter | Pro de100 con 33 usadas,0 reservadas | 33% de cuota utilizada; 67 disponibles; barra33%; verde; etiqueta semántica, no solo color | Unit + component visual + integration; Frontend implementado |
| QA-U049 / UsageMeter | Pro de100 con 49 usadas,0 reservadas | 49% de cuota utilizada; 51 disponibles; barra49%; verde; etiqueta semántica, no solo color | Unit + component visual + integration; Frontend implementado |
| QA-U050 / UsageMeter | Pro de100 con 50 usadas,0 reservadas | 50% de cuota utilizada; 50 disponibles; barra50%; naranja; etiqueta semántica, no solo color | Unit + component visual + integration; Frontend implementado |
| QA-U079 / UsageMeter | Pro de100 con 79 usadas,0 reservadas | 79% de cuota utilizada; 21 disponibles; barra79%; naranja; etiqueta semántica, no solo color | Unit + component visual + integration; Frontend implementado |
| QA-U080 / UsageMeter | Pro de100 con 80 usadas,0 reservadas | 80% de cuota utilizada; 20 disponibles; barra80%; rojo; aviso contextual sin bloquear | Unit + component visual + integration; Frontend implementado |
| QA-U100 / UsageMeter | Pro de100 con 100 usadas,0 reservadas | 100% de cuota utilizada; 0 disponibles; barra100%; rojo; agotado y renovación/Explorar planes | Unit + component visual + integration; Frontend implementado |
| QA35 / Cuota | Bordes de umbral, redondeo y snapshots fuera de orden | Clasificar ratio real, evitar80% naranja por redondeo; rechazar respuesta vieja; no negativo/NaN; total desconocido muestra sin datos. | Unit + contract; Frontend implementado |
| QA36 / Cuota | Dos solicitudes concurrentes con último crédito | Servidor admite máximo permitido; reservas y consumo atómicos; ninguna doble concesión. | API concurrency integration; Backend admission transaction |
| QA37 / Cuota | Agotamiento mensual y renovación | Distinguir plan de pago vs Free; fecha real y nueva cuota provienen del servidor; reloj cliente no resetea. | Integration + E2E; Frontend implementado |
| QA38 / Suscripciones | Starter/Pro/Power desde Dashboard→comparador→checkout→activado→Dashboard | 10/100/500 y7/90/180; mismo plan y periodo en todas las vistas; tres créditos Free no se suman. | E2E integration + visual; Backend + provider integration future |
| QA39 / Suscripciones | Marcar Pro recomendado y plan actual | Borde violeta/etiqueta sin inventar descuentos, precios ni ventajas; misma altura y CTA alineado. | Visual + component; Frontend implementado |
| QA40 / Pagos | Volver con success=true sin confirmación real | No activar plan ni otorgar cuota; mostrar verificando/pendiente según backend. | API security integration + E2E; Future billing attempt API |
| QA41 / Pagos | Webhook duplicado/fuera de orden/forjado | Firma e identidad verificadas, efecto único; evento falso no cambia estado. | Backend integration contract; Future provider implementation |
| QA42 / Pagos | Pendiente/fallido/cancelado y reintento | Plan anterior se conserva; recuperación a comparador o reconsulta; no cobros simulados en producción. | E2E integration; Frontend implementado |
| QA43 / Cancelación | Confirmar y cancelar diálogo | Mostrar fecha efectiva real; conservar acceso/cuota hasta fin; cancelar diálogo no modifica nada. | E2E + integration; Frontend implementado |
| QA44 / Historial | Búsqueda+severidad+fecha+versión, reset y sin resultados | Intersección coherente, criterios visibles, limpiar restaura; límites de fecha y paginación definidos. | Unit + integration + E2E; Frontend implementado |
| QA45 / Historial | Volver desde informe y cambiar filtros rápidamente | Conservar contexto válido; cancelar/ignorar respuestas antiguas; no mezclar páginas o cuentas. | E2E + integration; Frontend implementado |
| QA46 / Informe | Filtrar motores/severidad/nodo; abrir hallazgo | Categorías actuales exactas; conteos no contradictorios; acciones accesibles, detalle y recomendación correctos. | Component + E2E; Frontend implementado |
| QA47 / Informe | Permisos: ID ajeno, eliminado o expirado | Servidor rechaza; 410 del propio expirado según contrato; no filtrar evidencia por caché/URL. | API authorization integration; Frontend implementado |
| QA48 / Informe | Evidencia con HTML/JSON largo y valores sensibles | Escape/sanitize, sin XSS; no secretos/URLs privadas completas en UI/logs/telemetría. | Security + component; Backend sanitizer + rendering policy |
| QA49 / Errores | 403/404/500/502/503 | Composición centrada, acciones bajo mensaje, foco de recuperación, no fatalizar un error de importación. | Visual + E2E; Frontend implementado |
| QA50 / Errores | Error de servidor, offline y recuperación del servicio | Mantener contexto; reintento seguro respeta idempotencia; no duplicar nuevas auditorías. | E2E mocked + API integration; Frontend implementado |
| QA51 / Configuración | Guardar preferencias, cancelar eliminación de informe/cuenta | Persistir solo con backend; feedback real; cancelación no ejecuta; confirmación reforzada accesible. | Integration + E2E; Frontend implementado |
| QA52 / Rendimiento | Landing con JS lento, pestaña oculta y listas grandes | Texto final legible, inputs/nav disponibles; detener efectos opcionales; sin cientos de animaciones de hallazgos. | Manual + profiling + E2E; Frontend implementado |
| QA53 / Observabilidad | Error real con requestId y payload sensible | Correlación segura; no enviar workflow, credenciales, JWT, contenido del informe o datos de pago; revisar PII/replay. | Integration + log inspection; Sentry SDK/configuration selected after authorization |
| QA54 / Lanzamiento | Feature gates y fuentes ficticias | No demo-001 ni mocks mostrados como datos reales; compra deshabilitada por capacidad si no hay pasarela; controles demo fuera de producción. | E2E production-mode configuration; Frontend implementado |

## 14. Backlog incremental de implementación

No se creó ningún PR ni se escribió código de producto. Las15 etapas siguientes son un plan verificable. Cada PR debe tener un límite funcional claro, datos de prueba explícitos y evidencia. Backend y pasarela son dependencias de trabajo separado, no parte autorizada de este handoff. Si una etapa contiene gates distintos, dividirla antes de empezar; PR13 ya diferencia lectura13a y pagos13b.

### PR01 — Base Next.js y convenciones

| Aspecto | Definición |
| --- | --- |
| Depende de | Sin PR previo |
| Prioridad | P0 |
| Alcance | Inspeccionar repositorio solo después de autorización de implementación.; Confirmar versiones/gestor, estructura App Router y entorno de desarrollo ya existente; evitar reescribir proyecto.; Separar configuración pública/servidor y crear harness de pruebas mínimo. |
| Criterios de aceptación | Build/lint/typecheck reproducibles con herramientas actuales.; Ningún secreto ni dominio nuevo; no desplegar.; ADR corto con compatibilidad de SDK y contrato disponible. |
| Pruebas | Checks existentes + smoke build; Validador de configuración sin exponer valores |
| Gates externos | Autorización de implementación; D09 |

### PR02 — Tokens y recursos de marca

| Aspecto | Definición |
| --- | --- |
| Depende de | PR01 |
| Prioridad | P0 |
| Alcance | Mapear tokens.json a sistema CSS/tokens elegido.; Integrar24 SVG aprobados, BrandLogo único por composición/surface; sin fuentes binarias desde handoff.; Inter UI; confirmar carga y licencias oficiales; mono técnico solo cuando se necesite. |
| Criterios de aceptación | Proporciones y mínimos conservados.; Colores semánticos separados de violeta de marca.; Contraste de modos efectivos y tamaño44; registrar/corregir destructivo HC antes de ofrecerlo. |
| Pruebas | SVG/viewBox/proporción; Contraste unitario; Visual a1440/768/390/320 |
| Gates externos | D10; D11 para derivados de metadatos; D12 |

### PR03 — Layout público y navegación responsive

| Aspecto | Definición |
| --- | --- |
| Depende de | PR02 |
| Prioridad | P0 |
| Alcance | PublicHeader, Footer y contenedor responsivo.; Drawer público accesible reutilizando primitiva de diálogo; enlaces aprobados. |
| Criterios de aceptación | Header80desktop/68compact; contenido1200máximo público.; Mobile nav sin pérdida de rutas; foco/Escape/retorno.; Sin overflow320. |
| Pruebas | QA01,03,05,09,10; Visual header/footer4 tamaños |
| Gates externos | Ninguno adicional a aprobación de implementación |

### PR04 — Landing y páginas informativas

| Aspecto | Definición |
| --- | --- |
| Depende de | PR03 |
| Prioridad | P1 |
| Alcance | Landing, cómo funciona, precios públicos, seguridad y ayuda.; Plantilla legal reutilizable para términos/privacidad/cookies.; Sin gráficos o certificados inventados; catálogo puede ser fixture explícita solo en desarrollo. |
| Criterios de aceptación | Cuatro motores correctos e iconos originales.; Precios ausentes no se transforman en cero.; Copy de políticas distingue propuesto de disponible; no publicar texto legal sin aprobación. |
| Pruebas | Navegación pública; Acordeón teclado; Visual4 tamaños |
| Gates externos | D05 catálogo/precios; D08 publicación legal |

### PR05 — Primitivas y componentes compartidos

| Aspecto | Definición |
| --- | --- |
| Depende de | PR02 |
| Prioridad | P0 |
| Alcance | Button, fields/selects, badges, cards, dialogs/drawers/toast y feedback.; Un Select accesible con wrappers HistoryFilterField/ReportSelect; un Toast base.; States default/hover/focus/pressed/disabled/loading y anchos de texto. |
| Criterios de aceptación | Foco visible y labels.; Botón multilínea min44, padding12–16 y ancho adaptable; sin66 px heredado.; Sin duplicar componentes por pantalla. |
| Pruebas | Component tests semánticos; QA06–14; axe + keyboard |
| Gates externos | D12 contrastes efectivos |

### PR06 — Integración Clerk

| Aspecto | Definición |
| --- | --- |
| Depende de | PR03; PR05 |
| Prioridad | P0 |
| Alcance | Conectar flows sign-in/sign-up/verificación/reset/MFA del tenant.; Guardas de sesión y returnTo local seguro.; Aislar caché por usuario; no implementar contraseñas propias. |
| Criterios de aceptación | No acceso a datos privados sin autorización servidor.; Registro no concede Free solo por local variable.; Refresh/logout/expired session seguros. |
| Pruebas | QA15–17; Provider sandbox + E2E de sesión |
| Gates externos | D02 transporte/claims; configuración Clerk aprobada |

### PR07 — AppShell privado

| Aspecto | Definición |
| --- | --- |
| Depende de | PR05; PR06 |
| Prioridad | P0 |
| Alcance | Sidebar240, topbar72/64 y drawer compartido.; Rutas Dashboard/nueva/historial/Mi plan/planes/configuración.; Lectura de UsageSnapshot común sin lógica comercial local. |
| Criterios de aceptación | Marca Horizontal194 en hit44; drawer320 Wordmark144 y cierre legible.; Sincronizar lecturas por usuario/periodo; layout4 tamaños. |
| Pruebas | QA01–05,09–10; Deep links y refresh privado |
| Gates externos | D02; Viewer/usage APIs propuestas |

### PR08 — Dashboard y UsageMeter

| Aspecto | Definición |
| --- | --- |
| Depende de | PR07 |
| Prioridad | P0 |
| Alcance | Tres KPIs reales previstos; estado vacío/loading/error.; UsageMeter Full/Compact, aviso80 y agotado.; Fixtures aisladas para Storybook/harness mientras API falte, nunca fingir datos en producto. |
| Criterios de aceptación | 0/33/49/50/79/80/100 correctos.; Free y pagado separados; renovación real.; Disabled Nueva auditoría sin redirigir a Mi plan. |
| Pruebas | QA25,32–37 yQA-U*; Unit percentage/rounding + component visual |
| Gates externos | D03; resumen/UsageSnapshot pendientes |

### PR09 — Importación JSON y validación local

| Aspecto | Definición |
| --- | --- |
| Depende de | PR05; PR07 |
| Prioridad | P0 |
| Alcance | Dropzone, input accesible, metadata y selector de perfil.; Validación advisory tamaño/JSON/esquema y errores contextuales.; Sin conexión real ni simulación de éxito en producción. |
| Criterios de aceptación | 413/415/422 recuperables y legibles320/390.; No consumir al seleccionar o validar; controles demo separados del producto.; Datos sensibles no salen a logs. |
| Pruebas | QA06–08,18–22; Synthetic JSON tests |
| Gates externos | D01/D04 límites y catálogo de perfiles |

### PR10 — Adaptador FastAPI y estados de auditoría

| Aspecto | Definición |
| --- | --- |
| Depende de | PR06; PR09 |
| Prioridad | P0 |
| Alcance | Verificar OpenAPI real antes de consumir POST.; Adaptar request/response real, JWT, timeout/abort y errores.; Idempotencia, cuota y recuperación dependen del backend; soporte async solo si existe. |
| Criterios de aceptación | Un intento/clave, progreso indeterminado y final real.; Reintentos no duplican ni confunden429/cuota.; No exponer credenciales o autoridad de user_id. |
| Pruebas | QA16,23–31,36; Contract tests + sandbox integration; no mocks como prueba real |
| Gates externos | D01–04. Backend gaps must be implemented in separately authorized backend work. |

### PR11 — Informe y filtros de hallazgos

| Aspecto | Definición |
| --- | --- |
| Depende de | PR05; PR10 |
| Prioridad | P0 |
| Alcance | Informe dinámico /app/auditorias/[id], filtros y FindingDetail.; Evidencia sanitizada, loading/failed/expired/forbidden.; Solo lectura propia; expiración del servidor. |
| Criterios de aceptación | Cuatro motores y conteos reales.; JSON largo legible y sin XSS; detalle accesible.; 410 no recupera payload vencido. |
| Pruebas | QA24–25,46–48; Integration ownership/expiry + visual4 tamaños |
| Gates externos | D04 lectura de informe; D06 retención |

### PR12 — Historial y filtros responsive

| Aspecto | Definición |
| --- | --- |
| Depende de | PR05; PR10; PR11 |
| Prioridad | P0 |
| Alcance | Lista/tabla paginada propia con filtros compuestos.; Search izquierda + controles derecha desktop; full search+Filtros drawer compact.; Estados vacío/sin resultados y contexto de retorno. |
| Criterios de aceptación | Mismos criterios en todos los tamaños.; Sin respuestas antiguas que sobreescriban filtros.; Eliminar solo si contrato aprobado; nunca botón que finja persistencia. |
| Pruebas | QA44–45,47; Filter unit + API pagination + E2E |
| Gates externos | D04 list API; deletion contract if enabled |

### PR13 — Mi plan, catálogo y estados comerciales

| Aspecto | Definición |
| --- | --- |
| Depende de | PR08; PR10 |
| Prioridad | P1 |
| Alcance | Subentrega13a: lectura de plan/cuota, comparador y resultado informativo.; Subentrega13b separada: wiring checkout/cancelación solo tras pasarela/backend disponibles.; Preferencias/configuración y acciones destructivas como follow-up pequeño si su contrato se aprueba. |
| Criterios de aceptación | 10/100/500,7/90/180 y Free 3 sin mezcla.; Redirect no activa; fecha efectiva de cancelación real.; No precios ni pagos simulados como reales; gates explícitos. |
| Pruebas | QA32–43,51,54; Backend quota/payment replay tests + E2E sandbox |
| Gates externos | D03/D05–08; future provider integration. Split13a/13b into separate PRs when gates open. |

### PR14 — Errores, accesibilidad y movimiento final

| Aspecto | Definición |
| --- | --- |
| Depende de | PR04; PR05; PR08; PR11; PR12; PR13 |
| Prioridad | P1 |
| Alcance | Composiciones403/404/500/502/503 y fallos contextuales.; Aplicar motion.json con CSS primero, reduced-motion y foco.; Revisar Sentry/data scrubbing en PR pequeño adicional si SDK ya está autorizado/configurado. |
| Criterios de aceptación | No animaciones que controlen resultado o lectura.; Errores recuperables mantienen contexto.; Alto contraste destructivo resuelto o modo no ofrecido; sin afirmar certificación AA. |
| Pruebas | QA09–14,30–31,49–53; axe + manual SR + reduced motion + profiling |
| Gates externos | D10 React Bits optional/license; D12 HC contrast; Sentry SDK decision |

### PR15 — QA integral y preparación para despliegue

| Aspecto | Definición |
| --- | --- |
| Depende de | PR14 |
| Prioridad | P1 |
| Alcance | Automatizar recorridos completos y snapshots por tamaño.; Completar evidencia de API real y fallos/permisos/concurrencia.; Documentar runbook y variables requeridas solo por nombre; preparar checklist sin desplegar. |
| Criterios de aceptación | Todas las capacidades publicadas pasan pruebas reales, no solo mocks.; Backend/provider blockers visibles; no declarar listo un flujo gated.; No desplegar hasta aprobación separada. |
| Pruebas | MatrizQA completa, smoke y accesibilidad manual; Build/typecheck/lint + integración real autorizada |
| Gates externos | Backend completo, proveedor sandbox si se activa compra, autorización separada para despliegue |

El orden sugerido evita un cambio monolítico: tokens antes de layouts, primitivas antes de formularios, sesión antes de datos privados, contrato antes de integración y lectura comercial antes de pagos. No añadir animaciones opcionales, métricas avanzadas o eliminación de cuenta para desbloquear la auditoría principal. Las comprobaciones de cada PR deben probar comportamiento, no reflejar la misma implementación en asserts redundantes.

## 15. Decisiones e incidencias pendientes

| ID / prioridad | Tema | Responsable propuesto | Decisión / impacto |
| --- | --- | --- | --- |
| D01 / P0 | Contrato FastAPI real | Backend/API owner | Provide current OpenAPI request/response, content type, status enum and errors of POST; health/auth expectations. PR10 integration blocked; UI can use explicit fixtures. |
| D02 / P0 | JWT transport and audience | Frontend+backend auth owner | Approve Next BFF vs direct API; Clerk issuer/JWKS/audience if used, azp allowlist and CORS; no secrets in browser. PR06/10 real integration gate. |
| D03 / P0 | Quota and idempotency capabilities | Backend owner | Confirm atomic reservation/commit/release, durable attempt key, ownership and recovery contract; no client enforcement. PR08/10/13 real actions gated. |
| D04 / P0 | Lifecycle and persistence | Backend owner | Synchronous vs async actual capability; list/report/status/expiry APIs; supported n8n profiles and engine enums. PR10/11/12 integrate only confirmed operations. |
| D05 / P1 | Commercial catalog | Product owner | Prices, currency, taxes, billing period details, proration/upgrade/downgrade policy and payment provider remain undefined. PR13 purchase path gated; no invented amounts. |
| D06 / P1 | Retention and cancellation edge cases | Product+backend owner | Starter 7/Pro90/Power180 approved; confirm Free 7 suggested policy, expiry from created/completed timestamp, effect of cancellation/deletion, future access and Free fallback. PR11/13 server policy must be explicit. |
| D07 / P1 | Calendar and timezone | Product+backend owner | Prototype America/Lima dates are examples. Server defines period boundaries; render explicit user timezone and real renewsAt. Quota reset must not use browser clock. |
| D08 / P1 | Legal text and privacy lifecycle | Product owner | Approve real terms/privacy/cookie disclosures, support contact, deletion requests and backup retention policy. PR04 publication/PR13 destructive features gate. |
| D09 / P1 | Repository and SDK versions | Implementation owner | Repo was not inspected in3C; verify current Next.js/React/Clerk/Sentry versions, existing conventions and package manager after separate implementation authorization. Do not lock versions or rewrite scaffolding blindly. |
| D10 / P2 | Technical mono and optional motion | Design+implementation owner | Inter remains active UI. Geist Mono proposed for technical blocks; review exact font packages and React Bits license before installation; CSS may suffice. No global font migration authorized by handoff. |
| D11 / P2 | Social/production icon derivatives | Design+implementation owner | Approve OG1200×630 composition; ICO/180/192/512 derivatives can be generated from provided originals in asset PR. Original SVGs ready; do not claim raster metadata package complete. |
| D12 / P0 | High contrast mode acceptance | Implementation owner | Audit actual semantic foreground/background pairs in High contrast mode; destructive buttons require explicit contrast testing. Dark primary palette measurements do not certify every state. PR02/05/14 accessibility gate; preserve Figma unchanged in3C. |

El único defecto visual concreto nuevo identificado por cálculo en3C es ISSUE-HC-01. No se altera la identidad ni se reabre la Entrega 3B. Los demás pendientes son contratos o decisiones de implementación/comerciales. Figma muestra flujos representativos, no servicios integrados; hasta cerrar los gates no declarar el MVP completo o listo para cobros.

## 16. Uso del paquete por Codex y aprobación

Empezar por README-Codex.md, después este documento y los manifiestos. Resolver primero los gates del PR que se va a implementar, sin bloquear cambios independientes de UI por integraciones futuras. Leer el repositorio y su AGENTS.md solo cuando el usuario autorice implementación; adaptar el plan a convenciones actuales sin reconstruir el proyecto.

Antes de cada PR: escoger rutas/estados concretos, recuperar los frames exactos y componentes originales, conservar tokens/semántica y revisar320/390/768/1440. Las capturas sirven de referencia, nunca sustituyen los SVG del logo ni la estructura editable. Mantener demo data en harness o fixtures inequívocas y evitar que aparezcan en producto como datos reales.

Al finalizar3C, solicitar aprobación del handoff. No comenzar PR01, modificar servicios ni desplegar solo porque este backlog exista. La autorización actual termina con documentación y recursos de diseño.

### 16.1. Enlaces de la página de handoff

| Guía | Frame Figma |
| --- | --- |
| 00 — Inicio y alcance | [417:937](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-937) |
| 01 — Referencias de rutas | [417:938](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-938) |
| 02 — Tokens y componentes | [417:939](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-939) |
| 03 — Recursos vectoriales | [417:940](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-940) |
| 04 — Estados y movimiento | [417:941](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-941) |
| 05 — QA y plan de implementación | [417:942](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-942) |
| Recurso social1200×630 | [423:329](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=423-329) |

### 16.2. Archivos legibles por máquina

| Archivo | Contenido |
| --- | --- |
| routes.json | 18 rutas,5 auxiliares,72 referencias principales por tamaño, componentes, datos, estados y prioridades. |
| frames.json | 363 frames con IDs/dimensiones/clasificación/componentes/disparadores/destinos. |
| tokens.json | 61 tokens con alias/modos,10 estilos UI, medidas y propuestas marcadas. |
| components.json | 67 componentes/familias y variantes, responsables de reutilización. |
| assets.json / fonts.json | 24 SVG originales,7 derivados/contenedores, fuentes y licencias sin binarios. |
| states.json | 44 transiciones, guards y autoridad de estado. |
| contracts-proposed.json | 2 operaciones existentes reportadas +15 pendientes/futuras; DTO propuestos, no OpenAPI. |
| motion.json | 17 efectos con trigger/estados/duración/easing/mobile/reduced/performance. |
| qa.json | 61 casos y estado NOT_RUN para integración futura. |
| backlog.json | 15 etapas PR con dependencias/gates/aceptación/pruebas. |
| decisions.json / contrast-checks.json | 12 decisiones pendientes y pares de contraste con ISSUE-HC-01. |
| source-register.json / validation.json | Fuentes, grado de evidencia, aceptación del usuario y verificación del paquete. |
| handoff-index.json | Índice, versión, enlaces y alcance autorizado. |

## 17. Referencias técnicas y de licencia

Las referencias se revisaron para orientar decisiones del handoff, sin fijar versiones del repositorio que no se inspeccionó. Next.js, Clerk y CORS se usan como guía de seguridad, no como prueba de que ya estén configurados. La documentación Sentry devolvió un formato no recuperable en esta sesión; su configuración queda expresamente por validar con el SDK seleccionado.

| Fuente primaria | Uso |
| --- | --- |
| [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication) | Separar autenticación/sesión/autorización y proteger lecturas/mutaciones; versión del proyecto pendiente. |
| [Clerk manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification) | Claims, firma y authorized parties/orígenes; configuración real del tenant pendiente. |
| [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/) | Orígenes y credenciales precisos; CORS no sustituye auth. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG 22/) | Criterios de accesibilidad objetivo; no certificación. |
| [WAI-ARIA Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Foco, teclado y retorno de foco del diálogo. |
| [React Bits](https://reactbits.dev/get-started/index) | Catálogo de efectos candidatos; sin implementación. |
| [React Bits LICENSE](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) | MIT + Commons Clause upstream consultado; revisar versión antes de instalar. |
| [Inter LICENSE](https://github.com/rsms/inter/blob/master/LICENSE.txt) | SIL OFL 1.1 de la interfaz. |
| [Space Grotesk OFL](https://github.com/floriankarsten/space-grotesk/blob/master/OFL.txt) | SIL OFL 1.1, origen tipográfico de W3. |
| [Geist LICENSE](https://github.com/vercel/geist-font/blob/main/LICENSE.txt) | SIL OFL 1.1 del candidato técnico Geist Mono. |
| [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) | Referencia pendiente de lectura/versionado SDK; recomendaciones de minimización son propuesta de integración. |

