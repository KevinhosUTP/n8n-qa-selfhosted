# KevoLint · Registro de accesibilidad pendiente

Registro actualizado con la corrección visual autorizada el 19/10/2026. PR05a y PR05b están integrados; **PR05 global permanece abierto**. Este registro no constituye una auditoría axe ni una declaración de conformidad WCAG integral.

| ID | Revisión pendiente | Evidencia y condición de cierre |
| --- | --- | --- |
| AXE-PR05-01 | Resolver expresamente el gate axe del backlog original | Alternativa A (axe-core) seleccionada formalmente; instalación NO autorizada en PR05b. CDP/AX, teclado y contraste no lo sustituyen. Requiere revisión de SEC-PR01-01 y autorización independiente de dependencias/lockfile; gate abierto antes del cierre global de PR05 |
| A11Y-PR05-CHECKBOX-01 | Diferenciación visual Off/On | **Cerrado formalmente el 19/10/2026 tras aprobación de PR #10 y CI Linux satisfactorio del squash 933612d.** Off conserva geometría; On añade check-16 original como máscara decorativa oscura, sin cambiar sus bytes. Marca efectiva ≥3:1 sobre los fondos/estados probados, incluido disabled y foco. Véanse [cierre e informe](verification-a11y-choices.md#cierre-autorizado--pr-10) y [capturas](a11y-choices-evidence/README.md). No se cierra PR05 global |
| A11Y-PR05-SWITCH-01 | Diferenciación visual Off/On | **Cerrado formalmente el 19/10/2026 tras aprobación de PR #10 y CI Linux satisfactorio del squash 933612d.** Base original 40×20; thumb 12 px en x=4/24, y=4, contorno perceptible. Depende solo de :checked, sin animaciones ni modificación de SVG. Contraste, teclado/reset y forced-colors verificados; [cierre](verification-a11y-choices.md#cierre-autorizado--pr-10) y [evidencia](a11y-choices-evidence/README.md). No se cierra PR05 global |
| CHOICE-REACT-RESET-01 | Observación de baseline: eventos React después de reset nativo | En la secuencia Espacio → reset → clic, el navegador emite cuatro change y React registra dos, tanto con Choice como con inputs nativos sin decoración. checked, FormData y señales visuales se restablecen. Se conserva y compara el contrato existente, sin manipular trackers privados ni fabricar eventos. No se corrige este comportamiento de React en el alcance visual; véase informe |
| A11Y-MANUAL-SR | Lectores de pantalla | Pendientes anuncios reales, labels/hints/errores, required/disabled/readonly y lectura de cambios. El árbol AX automatizado no acredita lo que anuncia el lector |
| A11Y-MANUAL-ZOOM | Zoom nativo del navegador | Pendiente prueba manual con zoom del navegador. El reflow automatizado con CSS zoom 200% no es equivalente |
| A11Y-MANUAL-PLATFORMS | Navegadores adicionales y dispositivos físicos | Pendientes Safari/Firefox, interacción táctil física y combinaciones adicionales de sistema/navegador; revisar también el menú nativo de Select por plataforma |

La revisión histórica de PR05b conserva las capturas anteriores en [pr05b-evidence](pr05b-evidence/README.md). La corrección posterior conserva su evidencia nueva por separado en [a11y-choices-evidence](a11y-choices-evidence/README.md), con navegador, viewport, base Git, estado dirty y hashes de fuentes/imágenes. No se reetiquetan capturas anteriores como corregidas. El foco sigue siendo una señal de navegación distinta de la marca/posición de selección.

La aprobación formal del 19/10/2026 autoriza exclusivamente «Marca y posición»: adaptación CSS de color del check original, thumb posicional y contorno, documentados en `design-system/choice-accessibility.json`. No se habilitan temas completos ni se alteran los manifiestos, tokens o bytes SVG originales. Las dos correcciones conservan la semántica y el input nativo único; no constituyen una auditoría WCAG integral.

No se autorizan otras variantes, modificaciones de SVG originales, nuevas dependencias ni integración de axe por esta corrección. La revisión formal de PR #10 y la evidencia Linux satisfactoria posterior al merge cumplen la condición de cierre de los dos hallazgos visuales. Los pendientes manuales y AXE-PR05-01 permanecen abiertos.

Light y High Contrast completos siguen deshabilitados. ISSUE-HC-01 conserva su corrección aislada y las regresiones previas; ello no certifica los demás estados ni temas. D05, D08, PR06 y el bloqueo de despliegue comercial continúan abiertos. PR05b integrado; PR06 requiere autorización posterior y no se inicia con este cierre.


PR05b añade cobertura real de Dialog/Drawer/Toast: foco inicial/retorno, fondo inerte, motivos de cierre, formularios nativos, rechazo de concurrencia, scroll, desmontaje y región status estable. Los anuncios hablados de apertura/cierre/Toast siguen pendientes de lector de pantalla real; las mutaciones DOM y el árbol AX no prueban su anuncio.

## Cierre técnico PR05b · PR #9

PR05b integrado mediante squash `0898ae4338d9747250fbdaaefae07ff8b5cbad39`, desde el HEAD aprobado `ab9f7b2d0a4324a1521426905293fafbdd3068fe`. Véase [informe de cierre](verification-pr05b.md) y [registro de PR #9](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/9) para los resultados reales de CI del squash y del HEAD documental final.

El cierre no resuelve AXE-PR05-01, A11Y-PR05-CHECKBOX-01, A11Y-PR05-SWITCH-01 ni las comprobaciones manuales pendientes. No instala axe, no corrige estilos/SVG ni declara conformidad WCAG integral. PR05 global permanece abierto. SEC-PR01-01 conserva su vencimiento original del 31/10/2026 23:59 America/Lima; no se amplía su excepción. Sin despliegue ni inicio de PR06.

## Cierre posterior de correcciones visuales · PR #10

La aprobación de PR #10 autorizó el squash del HEAD `d9ac1185838ca68f2c6b3203c7532e3dc21a7782` a develop. Integración real: [`933612d31acd17edd9befa5c89ef8291cdfe323b`](https://github.com/KevinhosUTP/n8n-qa-selfhosted/commit/933612d31acd17edd9befa5c89ef8291cdfe323b). [Frontend/seguridad Linux](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160476) y [Python/Streamlit](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160528) finalizaron satisfactoriamente sobre ese push: 363 tests frontend, 15 Python, navegador y regresiones públicas, build, smoke, exposición, artefacto, audit y secretos. Véase el [informe técnico](verification-a11y-choices.md#cierre-autorizado--pr-10) para los cuatro jobs y el vínculo revisión/inventario Linux. El HEAD documental final y su CI se registran en [PR #10](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/10).

Esta evidencia permite cerrar únicamente A11Y-PR05-CHECKBOX-01 y A11Y-PR05-SWITCH-01. `CHOICE-REACT-RESET-01` conserva su observación de dos callbacks React/cuatro change nativos en ambos controles y referencias tras la secuencia de reset. La [captura forced-colors](a11y-choices-evidence/README.md#estado-interactivo-de-la-captura-forced-colors) se tomó a 1440 px después de activar con Espacio el Checkbox del grupo inicialmente Off: está checked y enfocado; su Switch sigue Off. Los títulos no cambian al interactuar y no representan una matriz inicial inmutable. El contador 2 pertenece a la secuencia previa, no exclusivamente a esa pulsación. Es fallback nativo del sistema, no tema High Contrast validado.

PR05 global y AXE-PR05-01 siguen abiertos; axe-core no instalado. Lectores de pantalla reales, zoom nativo, otros navegadores y dispositivos físicos permanecen pendientes. No se declara conformidad WCAG integral. SEC-PR01-01 continúa temporalmente aceptada, no corregida, sin cambios de condiciones o vencimiento (31/10/2026 23:59 America/Lima). No se despliega ni se inicia PR06; no hay nuevas modificaciones funcionales.
