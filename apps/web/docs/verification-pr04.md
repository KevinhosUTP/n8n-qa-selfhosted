# PR04 · Landing y páginas informativas

Base remota reconfirmada: `855f49339d7ae4f8a14a506aa437c70b29d9cb54` de `develop`.
Rama autorizada: `codex/kevolint-pr04-public-pages`.
Alcance aprobado por el usuario: ocho vistas del handoff 3C, adaptaciones honestas de contenido e interacciones. Entrega exclusivamente como Draft PR hacia develop; sin merge ni despliegue.

## Fuentes e integridad

Se inspeccionaron los 32 frames de las ocho rutas, los componentes QAMotorCard/PlanCard/Accordion, README-Codex, handoff y manifiestos originales de rutas, frames, componentes, movimiento, backlog y decisiones. El manifiesto `design-system/public-pages.json` registra el hash del ZIP aprobado, los hashes de esos manifiestos, los 32 IDs y doce exportaciones funcionales originales. Las instrucciones de los documentos se usan como referencia; no amplían la autorización del usuario.

| Ruta | 1440 | 768 | 390 | 320 |
| --- | --- | --- | --- | --- |
| / | 19:2 | 133:22214 | 19:99 | 126:11440 |
| /como-funciona | 19:196 | 133:22538 | 19:257 | 126:11747 |
| /precios | 19:318 | 133:22704 | 19:347 | 126:11908 |
| /seguridad | 19:376 | 133:22898 | 19:409 | 126:12090 |
| /ayuda | 19:442 | 125:9829 | 19:476 | 126:12212 |
| /legal/terminos | 19:510 | 125:9942 | 19:535 | 126:12325 |
| /legal/privacidad | 19:560 | 125:10032 | 19:585 | 126:12415 |
| /legal/cookies | 19:610 | 125:10122 | 19:633 | 126:12505 |

No se alteran los 61 tokens originales, su generador, los 24 SVG de marca, Inter 4.1 ni su licencia. Los iconos nuevos proceden de los componentes originales de Figma; se descargaron con los URLs de get_design_context, se conservaron sus bytes y se registraron hashes y dimensiones 24×24. No hay URLs temporales en el código runtime.

## Implementación

- Ocho páginas en el grupo App Router público existente, con metadatos individuales y noindex heredado; las legales también lo declaran expresamente.
- Se conservan PublicContainer, header/footer, BrandLogo, Button, PublicNavLink, RouteFocus y las mecánicas internas del drawer. No se construye la biblioteca general de PR05.
- Composiciones específicas: introducción editorial, pasos, motores QA, informe DEMO estático, planes propuestos, FAQ y plantilla legal.
- Páginas principalmente en servidor. Código cliente limitado al hero/observer, búsqueda y navegación ya existente. Sin endpoints de negocio nuevos ni llamadas al motor desde el navegador.
- Ayuda filtra preguntas reales localmente, sin servicios externos; normaliza mayúsculas/acentos, combina palabras y anuncia resultados y ausencia de coincidencias. El formulario GET usa renderizado de servidor como alternativa real sin JavaScript.
- FAQ nativo details/summary, inicialmente abierto como la referencia, accionable mediante puntero, Enter y Espacio incluso sin JavaScript.
- La activación de destinos ahora reales reveló una carrera de foco en el drawer de PR03: el main seguía inerte cuando RouteFocus intentaba enfocarlo. El retorno tras close() ahora enfoca el main del destino y reinicia su scroll. Cancelar, misma ruta, cambio de viewport y desmontaje conservan sus comprobaciones previas.

## Comparación visual y adaptaciones autorizadas

Se mantiene la composición por frame: hero 552/600 con gap48 en el contenedor desktop de 1200; pasos en tres/cuatro columnas desktop y apilados compactos; motores en cuatro/dos/una columnas; planes en tres/dos/una; lectura legal con máximo900. Se conservan los gutters PR02/PR03 y los límites767/768 y1023/1024. El hero usa48/56 desktop y36/44 compacto; títulos interiores40/48 y32/40. El salto explícito del título de precios se conserva. Las dimensiones que no son tokens originales son valores trazados a esos frames.

Las capturas mantienen barras de desplazamiento nativas. Los informes distinguen ancho emulado y ancho de layout disponible; no se ocultan barras para forzar coincidencia con el lienzo.

Adaptaciones aprobadas y visibles:
- Todos los importes siguen como “Precio por definir”. Cuotas10/100/500, historial7/90/180 y concurrencia se identifican como propuestas no aprobadas ni operativas. No hay compra, selección persistente, checkout o suscripción.
- Los CTAs sin servicio tienen estado deshabilitado y explicación, o enlace real al destino pendiente con aviso expreso de404. No se crean informes privados ni recuperaciones de cuenta ficticias.
- La muestra mantiene los datos ficticios24/28 y1/2/18, con DEMO y evidencia redactada. Se sustituye la acción de informe interactivo no implementada por una explicación estática.
- Los textos de ayuda, seguridad y privacidad distinguen capacidades estáticas inspeccionadas de identidad, historial, cuotas, proveedores, conservación y controles futuros.
- Los tres documentos legales muestran “Pendiente de revisión legal”, desarrollo exclusivamente y D08 pendiente. Se adaptan las afirmaciones futuras para no presentarlas como políticas vigentes.
- Cookies no incorpora analítica, banner, consentimiento o guardado ficticio. El control de preferencias está deshabilitado y explicado.
- La búsqueda sustituye la simulación de Figma por un comportamiento local real, con estado vacío y anuncio accesible.

Los avisos y textos honestos aumentan alturas y cambian algunos saltos de línea respecto del prototipo. Es una adaptación de contenido expresamente autorizada; no se afirma equivalencia pixel-perfect ni se reinterpretan identidad o recursos.

## Movimiento

| Movimiento | Implementación |
| --- | --- |
| M01 | Tres grupos CSS sobre un único H1;160ms por grupo, retardos0/200/400ms; una vez por documento, sin repetir al volver por navegación cliente. |
| M02 | IntersectionObserver una vez + CSS opacity/transform480ms. SSR visible; sin JS permanece visible. Foco dentro de la sección elimina inmediatamente cualquier ocultación visual. |
| M03 | Borde de motor QA en hover; focus-within preparado sin añadir tab stops artificiales a tarjetas informativas. Superficie original conservada. |
| M09 | PlanCard hover180ms, recomendación Pro persistente; sin selección comercial ni persistencia. |
| M17 | Disclosure nativo y fade150ms del contenido abierto. |
| M04 / M14 | M04 excluido; M14 conserva los SVG estáticos originales. |

Movimiento reducido elimina entradas/transiciones. No se instalan React Bits, GSAP ni otras dependencias.

## Verificación reproducible

Instalación limpia: `npm ci --no-audit --no-fund`, con las versiones ya fijadas. El audit completo sigue siendo un control separado obligatorio, sin omitir desarrollo.

| Comprobación | Resultado local |
| --- | --- |
| Lint / TypeScript | Aprobados |
| Vitest | 301 pruebas: cobertura previa de276 con expectativas de disponibilidad actualizadas y25 casos nuevos |
| Tokens y recursos | 61 tokens, generación determinista,24 SVG de marca, doce iconos y fuente/licencia conservados |
| PR02 navegador | 14 muestras y32 estados; contraste efectivo, teclado, movimiento reducido, geometría y reflow existentes |
| PR03 navegador | Siete anchos; ciclo de foco, fondo inerte, Escape, scrim, scroll, viewport, rutas, modificadores y desmontaje |
| PR04 navegador standalone | 56 muestras: ocho páginas ×320/390/767/768/1023/1024/1440;32 capturas de frames, FAQ/AX y búsqueda |
| Sin JavaScript | Ocho páginas legibles; FAQ nativo y búsqueda GET en Ayuda comprobados |
| Movimiento / CTA / consola | Reducción, observer, hover, historial del hero, destinos honestos y ausencia de errores runtime/consola |
| Contraste y estabilidad | Textos efectivos con mínimo5,64:1 en56 muestras; CLS0 en el entorno headless controlado; no son métricas de campo |
| Frontera / build / smoke | Rechazo de importación server-only desde cliente y entorno público no aprobado; build sin proveedores; standalone correcto |
| Python / Streamlit | 15 regresiones, compileall y smoke inicial aprobados sin cambios de backend |
| Audit local | Ejecutado completo: cuatro nodos high del único GHSA conocido; aceptación local correctamente denegada |

Se conservaron los checks de PR01–PR03. La única adición al workflow es el navegador PR04 contra el standalone preparado, después del smoke y antes de la inspección física de seguridad. No se elimina ningún step/job, permiso, límite de15 minutos o condición de seguridad.

Los logs locales completos son salidas ignoradas bajo `.tools/pr04`. La evidencia seleccionada se conserva en `pr04-evidence/`, con hashes y procedencia. Sus capturas Windows corresponden al árbol de trabajo PR04 anterior al primer commit; no se presentan como capturas Linux ni como imágenes producidas por el SHA final. GitHub Actions repite los checks contra su revisión concreta. Los enlaces y resultados del último commit se registran en la descripción del Draft PR para evitar una autorreferencia de commits en este archivo.

### Incidencias durante la verificación

- El sandbox Windows no permitía crear junctions de tres fixtures de seguridad ni escribir cierta configuración de Next. Las pruebas se repitieron fuera del sandbox sin alterar controles y aprobaron.
- Se corrigieron la preparación de imágenes lazy de páginas largas y el punto inicial del test de teclado, manteniendo las aserciones originales.
- Un arranque de desarrollo quedó esperando tras cambios de caché/instalación; se terminó solo su árbol de procesos y se eliminó únicamente su fixture verificada y caché ignorada. La repetición completa pasó.
- Una ejecución elevada no se inició por el límite temporal del revisor automático de aprobaciones. Se reintentó después del restablecimiento; no se eludió el control.
- El escaneo previo clasificó el identificador público del archivo Figma bajo la propiedad fileKey como posible clave genérica. Se registró mediante su URL completa de procedencia, sin cambiar el recurso. No era una credencial; no se añadió ninguna exclusión ni se modificó el escáner.

## Seguridad y bloqueos conservados

SEC-PR01-01 permanece abierta, temporalmente aceptada y **no corregida**, responsable `KevinhosUTP`. Vencimiento original: **31/10/2026,23:59 America/Lima**, `2026-11-01T04:59:00Z`; sin renovación. Revisiones del24 y31 de octubre conservadas.

La política, script de seguridad, dependencias y lockfile permanecen sin cambios. El lockfile versionado mantiene `aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5`. Su copia local Windows usa CRLF y difiere físicamente; no se normaliza ni se amplía el hash autorizado. Tampoco se simula contexto GitHub. Los comandos locales exposición/artefacto/dependencias rechazan la rama diagnóstica no autorizada; esto no acredita inspección Linux.

La aceptación técnica depende del CI final del PR interno hacia develop: foundation, navegador Linux, build/smoke, exposición, artefacto y audit del mismo commit, secretos y Python. Un hallazgo adicional, anomalía, vencimiento o inspección incompleta bloquea la aceptación. Main, forks, producción y despliegues siguen excluidos de la excepción.

## Limitaciones y condiciones de publicación

- D05 sigue abierto: precios, cuotas finales, conservación y condiciones comerciales requieren aprobación.
- D08 sigue abierto: responsable, jurisdicción, contacto, proveedores, conservación, eliminación, respaldos e inventario de cookies necesitan revisión.
- /sign-in y /sign-up siguen siendo404 de PR06. No hay autenticación, backend integrado, pagos o dashboard.
- Sin verificación con lectores de pantalla, dispositivos físicos, Safari/Firefox, zoom nativo manual o cobertura exhaustiva. No se declara certificación WCAG integral. Los tiempos headless no son métricas de campo ni de dispositivos móviles físicos.
- Light y High Contrast completos permanecen deshabilitados; ISSUE-HC-01 conserva su corrección aislada.
- No se autoriza despliegue comercial, merge, PR05, infraestructura ni proveedores. No se modifican main ni el PR #3 histórico.
