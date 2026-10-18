# KevoLint · Registro de accesibilidad pendiente

Registro actualizado durante el cierre autorizado de PR05a / PR #8. PR05a está integrado; **PR05 global permanece abierto**. Este registro no constituye una auditoría axe ni una declaración de conformidad WCAG integral.

| ID | Revisión pendiente | Evidencia y condición de cierre |
| --- | --- | --- |
| AXE-PR05-01 | Resolver expresamente el gate axe del backlog original | Axe no instalado. CDP/AX, pruebas de teclado y contraste no lo sustituyen. Requiere autorización específica para incorporar la herramienta o aceptación formal de otra estrategia antes del cierre global de PR05 |
| A11Y-PR05-CHECKBOX-01 | Diferenciación visual entre Checkbox seleccionado y no seleccionado, sin depender exclusivamente del color | Estado: **pendiente de revisión específica / NOT_RUN**. La implementación actual cambia el fondo del control; comprobar con navegador real la señal perceptible del estado, además de su semántica nativa checked. Identificar diferencias de forma, marca, contorno o texto si existen; no asumir que un contraste aprobado demuestra por sí solo diferenciación suficiente |
| A11Y-PR05-SWITCH-01 | Diferenciación visual entre Switch seleccionado y no seleccionado, sin depender exclusivamente del color | Estado: **pendiente de revisión específica / NOT_RUN**. Usa los SVG originales off/on de Figma 16:253 y 16:256. Revisar ambos estados renderizados y comprobar una señal visual reconocible independiente del tono; la semántica switch/checked ya probada no demuestra esta condición visual |
| A11Y-MANUAL-SR | Lectores de pantalla | Pendientes anuncios reales, labels/hints/errores, required/disabled/readonly y lectura de cambios. El árbol AX automatizado no acredita lo que anuncia el lector |
| A11Y-MANUAL-ZOOM | Zoom nativo del navegador | Pendiente prueba manual con zoom del navegador. El reflow automatizado con CSS zoom 200% no es equivalente |
| A11Y-MANUAL-PLATFORMS | Navegadores adicionales y dispositivos físicos | Pendientes Safari/Firefox, interacción táctil física y combinaciones adicionales de sistema/navegador; revisar también el menú nativo de Select por plataforma |

Para las revisiones Checkbox/Switch se conservarán capturas reales de Off/On en los anchos relevantes (320/390/768/1440), con foco y sin foco, y se comprobará la identificación visual del estado. Una inspección en escala de grises o una simulación puede aportar evidencia adicional, pero no reemplaza la revisión completa. Deben distinguirse color/tono, luminosidad, geometría y contenido, y documentarse las limitaciones observadas. No se registra aún un resultado de conformidad o incumplimiento.

**No se autoriza cambiar los SVG originales ni introducir marcas, thumb, estilos, texto de estado o variantes visuales nuevas para resolver estos puntos.** Si se demuestra una señal insuficiente, se presentará una propuesta de corrección para aprobación separada. Este cierre solo registra los pendientes y conserva los componentes actuales.

Light y High Contrast completos siguen deshabilitados. ISSUE-HC-01 conserva su corrección aislada y las regresiones previas; ello no certifica los demás estados ni temas. D05, D08, PR06 y el bloqueo de despliegue comercial continúan abiertos. No iniciar PR05b o PR06 sin autorización posterior.
