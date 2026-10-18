# Evidencia real PR05b

Treinta PNG capturados en Chrome 155.0.8059.84 / Windows mediante CDP, sin instalar navegador, axe u otras dependencias. `evidence.json` registra navegador, base Git, hashes de las fuentes renderizadas y de cada imagen. La captura precede al commit de implementación, sobre árbol dirty identificado; no se atribuye al SHA final ni acredita ejecución Linux.

| Familia | Evidencia |
| --- | --- |
| Dialog | [320](dialog-320.png), [390](dialog-390.png), [768](dialog-768.png), [1440](dialog-1440.png) |
| Drawer | [320](drawer-320.png), [390](drawer-390.png), [768](drawer-768.png), [1440](drawer-1440.png) |
| Formulario | [320](form-320.png), [390](form-390.png), [768](form-768.png), [1440](form-1440.png) |
| Toast | [320](toast-320.png), [390](toast-390.png), [768](toast-768.png), [1440](toast-1440.png) |
| Off/On | [320](boolean-off-on-320.png), [390](boolean-off-on-390.png), [768](boolean-off-on-768.png), [1440](boolean-off-on-1440.png) |
| Foco Checkbox | [320](boolean-checkbox-focus-320.png), [390](boolean-checkbox-focus-390.png), [768](boolean-checkbox-focus-768.png), [1440](boolean-checkbox-focus-1440.png) |
| Foco Switch | [320](boolean-switch-focus-320.png), [390](boolean-switch-focus-390.png), [768](boolean-switch-focus-768.png), [1440](boolean-switch-focus-1440.png) |
| Altura reducida | [Dialog 320×320](dialog-short-height-320.png) |
| Fixture completa | [Vista general](modal-feedback-overview.png) |

La fixture y sus textos son muestras técnicas identificadas; no implementan operaciones de negocio. La inspección visual compara geometría, superficies, tipografía e iconos con los contextos originales de Figma. No es una comparación automática pixel-perfect ni una auditoría WCAG integral.

La revisión Off/On identifica cambios de relleno/color/luminosidad, sin marca ni desplazamiento diferenciadores observados. Los SVG y controles permanecen intactos; cualquier corrección requiere aprobación independiente. Axe, anuncios reales con lectores de pantalla, zoom nativo, navegadores adicionales y táctil físico siguen pendientes.

Reproducción: desde apps/web ejecutar `node scripts/verify-modal-feedback.mjs` con Chrome/Edge existente. La fixture temporal se retira al terminar, prebuild la rechaza si queda presente y smoke exige 404 en standalone. Los resultados de Linux del último commit se enlazan en el Draft PR.
