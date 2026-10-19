# Evidencia de implementación · Checkbox/Switch A11Y

Capturas reales de Chrome/Windows sobre los componentes Next.js implementados, no la ilustración del diagnóstico. `evidence.json` conserva navegador, revisión base, dirty, hashes de fuentes y PNG, dimensiones/estado, contraste y resultados de interacción. La revisión/captura precede al commit: no se atribuye su base SHA al último commit del PR. Los hashes de fuentes permiten contrastar los componentes capturados con ese commit; CI registra la ejecución Linux del código publicado.

El esquema v2 expresa cada integridad mediante campos separados `path` y `sha256`, tanto para bytes originales como para normalización LF. La forma anterior usaba rutas como claves; dos hashes de tokens.generated.css dispararon generic-api-key. Se recalcularon y verificaron como integridades de archivo, se conservaron todos los datos y se cambió únicamente su estructura; no se añadieron exclusiones, pragmas ni reglas al escáner. El fallo inicial queda enlazado en el informe/PR.

| Evidencia | 320 | 390 | 768 | 1440 |
| --- | --- | --- | --- | --- |
| Off/On | [320](boolean-off-on-320.png) | [390](boolean-off-on-390.png) | [768](boolean-off-on-768.png) | [1440](boolean-off-on-1440.png) |
| Checkbox con foco | [320](choice-checkbox-focus-320.png) | [390](choice-checkbox-focus-390.png) | [768](choice-checkbox-focus-768.png) | [1440](choice-checkbox-focus-1440.png) |
| Switch con foco | [320](choice-switch-focus-320.png) | [390](choice-switch-focus-390.png) | [768](choice-switch-focus-768.png) | [1440](choice-switch-focus-1440.png) |
| Fondos, disabled y errores | [320](choice-surfaces-disabled-errors-320.png) | [390](choice-surfaces-disabled-errors-390.png) | [768](choice-surfaces-disabled-errors-768.png) | [1440](choice-surfaces-disabled-errors-1440.png) |

[Fallback forced-colors](choice-forced-colors.png). Capturas mantienen el ancho del viewport para evitar reflow al capturar un elemento estrecho; no se retoca el contenido de los controles. Solo se excluye la herramienta de desarrollo de Next. Los estados de foco se capturan tras teclado, no dibujando un anillo ficticio.

Los SVG originales y su geometría se conservan. Las diferencias respecto de Figma son las adaptaciones aprobadas del 19/10: máscara oscura, thumb posicional y contorno perceptible. No se habilitan temas completos. Estas capturas no certifican WCAG, axe ni anuncios de lectores de pantalla.
