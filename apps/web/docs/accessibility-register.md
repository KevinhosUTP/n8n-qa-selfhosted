# KevoLint · Registro de accesibilidad pendiente

Registro actualizado durante el cierre autorizado de PR05b / PR #9. PR05a y PR05b están integrados; **PR05 global permanece abierto**. Este registro no constituye una auditoría axe ni una declaración de conformidad WCAG integral.

| ID | Revisión pendiente | Evidencia y condición de cierre |
| --- | --- | --- |
| AXE-PR05-01 | Resolver expresamente el gate axe del backlog original | Alternativa A (axe-core) seleccionada formalmente; instalación NO autorizada en PR05b. CDP/AX, teclado y contraste no lo sustituyen. Requiere revisión de SEC-PR01-01 y autorización independiente de dependencias/lockfile; gate abierto antes del cierre global de PR05 |
| A11Y-PR05-CHECKBOX-01 | Diferenciación visual entre Checkbox seleccionado y no seleccionado, sin depender exclusivamente del color | Estado: **revisión visual EJECUTADA; resolución pendiente**. Off/On a 320/390/768/1440 con/sin foco: misma geometría de 20×20, sin marca de check ni desplazamiento identificados; cambia el relleno oscuro/violeta y la luminosidad. El contorno no aporta por sí solo una identificación inequívoca del estado. No se acredita señal independiente del color ni se considera resuelto por checked/contraste |
| A11Y-PR05-SWITCH-01 | Diferenciación visual entre Switch seleccionado y no seleccionado, sin depender exclusivamente del color | Estado: **revisión visual EJECUTADA; resolución pendiente**. SVG originales 16:253/16:256: Off/On conserva la silueta de 40×20 y posición; no se identifica un thumb desplazado ni texto/marca diferenciadora. Cambian relleno, luminosidad y color. La semántica switch/checked no resuelve esta limitación visual |
| A11Y-MANUAL-SR | Lectores de pantalla | Pendientes anuncios reales, labels/hints/errores, required/disabled/readonly y lectura de cambios. El árbol AX automatizado no acredita lo que anuncia el lector |
| A11Y-MANUAL-ZOOM | Zoom nativo del navegador | Pendiente prueba manual con zoom del navegador. El reflow automatizado con CSS zoom 200% no es equivalente |
| A11Y-MANUAL-PLATFORMS | Navegadores adicionales y dispositivos físicos | Pendientes Safari/Firefox, interacción táctil física y combinaciones adicionales de sistema/navegador; revisar también el menú nativo de Select por plataforma |

La revisión PR05b conserva capturas reales Off/On a 320/390/768/1440, sin foco y con foco en cada familia, en [pr05b-evidence](pr05b-evidence/README.md). Las dimensiones/estados CSS y las capturas se registran con navegador, base Git, estado dirty y hashes de las fuentes renderizadas. Se inspeccionaron visualmente muestras reales seleccionadas y se verificaron geometría/estados en los siete anchos. El foco añade el mismo contorno de navegación; no es una señal de selección. Los encabezados Off/On identifican las muestras de prueba, no cambian el componente.

Resultado: la diferencia observada depende del relleno, luminosidad y color; no se identificó una señal independiente suficiente para dar por cerrado el punto. No se declara una auditoría WCAG integral ni se infiere conformidad de una prueba en escala de grises. Una corrección visual necesita propuesta y aprobación separadas. Los controles y SVG originales quedan intactos.

**No se autoriza cambiar los SVG originales ni introducir marcas, thumb, estilos, texto de estado o variantes visuales nuevas para resolver estos puntos.** Si se demuestra una señal insuficiente, se presentará una propuesta de corrección para aprobación separada. Este cierre solo registra los pendientes y conserva los componentes actuales.

Light y High Contrast completos siguen deshabilitados. ISSUE-HC-01 conserva su corrección aislada y las regresiones previas; ello no certifica los demás estados ni temas. D05, D08, PR06 y el bloqueo de despliegue comercial continúan abiertos. PR05b integrado; PR06 requiere autorización posterior y no se inicia con este cierre.


PR05b añade cobertura real de Dialog/Drawer/Toast: foco inicial/retorno, fondo inerte, motivos de cierre, formularios nativos, rechazo de concurrencia, scroll, desmontaje y región status estable. Los anuncios hablados de apertura/cierre/Toast siguen pendientes de lector de pantalla real; las mutaciones DOM y el árbol AX no prueban su anuncio.

## Cierre técnico PR05b · PR #9

PR05b integrado mediante squash `0898ae4338d9747250fbdaaefae07ff8b5cbad39`, desde el HEAD aprobado `ab9f7b2d0a4324a1521426905293fafbdd3068fe`. Véase [informe de cierre](verification-pr05b.md) y [registro de PR #9](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/9) para los resultados reales de CI del squash y del HEAD documental final.

El cierre no resuelve AXE-PR05-01, A11Y-PR05-CHECKBOX-01, A11Y-PR05-SWITCH-01 ni las comprobaciones manuales pendientes. No instala axe, no corrige estilos/SVG ni declara conformidad WCAG integral. PR05 global permanece abierto. SEC-PR01-01 conserva su vencimiento original del 31/10/2026 23:59 America/Lima; no se amplía su excepción. Sin despliegue ni inicio de PR06.
