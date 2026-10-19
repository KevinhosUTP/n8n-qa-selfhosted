# KevoLint · Corrección visual A11Y Checkbox y Switch

Autorización formal de «Marca y posición», 19/10/2026. Base local y remota reconfirmada en `c9164a39306bbaa9e8f4a5c8b0d94331e54068f7`, árbol limpio; rama independiente `codex/kevolint-a11y-checkbox-switch`. La entrega inicial fue el Draft PR #10; su integración y verificación posterior, autorizadas por separado, se registran al final. No se despliega ni se inicia PR06. El HEAD documental final y sus resultados se enlazan en PR #10, evitando un commit que pretenda referenciarse a sí mismo.

## Implementación y fidelidad

Se conservan las composiciones aprobadas: [Checkbox 4:524](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=4-524), [Switch 16:258](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=16-258), elipses Off/On 16:253/16:256 y [check original de 16 px 3:208](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=3-208). El diagnóstico confirmó ausencia de check/thumb en el original; su incorporación es la adaptación expresamente aprobada, no una variante original atribuida a Figma.

- Checkbox mantiene caja 20×20, Off vacío, borde/radio, rellenos y layout originales. On añade la máscara del SVG original de 16×16, centrada a 2 px, con color/surface oscuro sobre accent. No se altera ni redibuja el recurso.
- Switch mantiene base original 40×20 y añade thumb de 12 px, x=4 Off / x=24 On, y=4. Off usa text sobre raised y On surface sobre accent. Contorno elíptico superpuesto de 1 px muted, dentro de la misma caja. No hay animación nueva.
- Choice conserva un único input por control. El contenedor de presentación no es aria-hidden; solo la capa decorativa lo es, sin tabindex/eventos ni nombre. Estado visual mediante :checked, sin nuevo estado React ni handlers de producción. Radio conserva su marcado y aspecto.
- Se conservan API, ref, labels/IDs, hint/error, required/disabled, controlled/uncontrolled, onChange, reset y FormData. No se añade readonly ni estado mixed visual no aprobado.
- Foco existente de 2 px separado 2 px; targets mínimos 44 px y crecimiento por texto largo. Forced-colors oculta decoración y conserva apariencia nativa. Se ajustó especificidad dentro de ese media query para que :checked no conserve una imagen por encima del fallback. Esto no habilita un tema High Contrast.
- `design-system/choice-accessibility.json` registra la adaptación aparte de los manifiestos originales. No cambia ningún token, fuente, SVG, dependencia, lockfile, Button, Alert, ModalCore, script/política SEC o workflow.

Revisión React aplicada: imports directos existentes, ninguna suscripción/effect/estado derivado adicional en el componente, props/ref nativas conservadas y presentación decorativa no interactiva. El estado añadido a la fixture cuenta eventos de prueba; nunca se publica.

## Pruebas locales reales

Windows, Node 22.20.0, Chrome 155.0.8059.84. Las capturas y datos corresponden a fuentes renderizadas sobre el árbol de implementación identificado por base SHA, dirty y hashes, no se atribuyen falsamente al SHA futuro. [Evidencia](a11y-choices-evidence/README.md).

| Área | Resultado |
| --- | --- |
| Unitarias frontend | **363 aprobadas: 356 existentes + 7 nuevas**. Input único, decoración fuera del árbol accesible, estados/atributos controlados, error/disabled/required y Radio sin decoración nueva; integridad de SVG y tokens conservada |
| Python/Streamlit | **15 regresiones aprobadas**, compileall y smoke inicial Streamlit. Aviso de deprecación del entorno de test existente; sin cambios de backend ni paquetes |
| Lint y TypeScript | Aprobados; sin nuevas dependencias ni relajación de reglas |
| Frontera cliente/servidor | Compilaciones negativas aprobadas para import server-only y entorno público no revisado |
| Build/smoke | Build sin credenciales mediante testEnvironment; ocho rutas públicas 200, fixtures/privadas/sign-in/sign-up 404; runtime standalone sin canary público |
| PR02 | Navegador: 14 muestras, 32 estados; marca/Button/fuente, interacción y movimiento reducido |
| PR03 | Siete anchos; navegación, drawer, foco/inert, scroll, Escape, lifecycle, historial y destinos pendientes |
| PR04 | Standalone: 56 muestras, 32 frames, ocho páginas sin JS, FAQ, búsqueda GET/local, CTA, movimiento y consola |
| PR05a | Siete anchos; campos nativos, controlled/uncontrolled, reset, eventos, teclado/AX, Select, recursos y contraste |
| PR05b y nuevas señales | Siete anchos; Dialog/Drawer/Toast y lifecycle completos, además de marca/thumb/contorno, errores, disabled, foco, teclado, puntero y formularios |
| Secretos local | CLI oficial existente: 51 commits, sin hallazgos. El escaneo que incluye el nuevo commit es obligatorio en CI |

Nueva cobertura integrada en el job Linux existente, sin modificar el workflow: el verificador PR05b llama `check-choice-accessibility.mjs`. Se miden 22 controles en cada ancho 320/390/767/768/1023/1024/1440, en total 154 observaciones de estados. Se prueban tres superficies (background/surface/raised), On/Off, disabled por fieldset, hints/errores y foco en los controles habilitados. Capturas a 320/390/768/1440 y forced-colors aparte.

El contraste usa estilos efectivos del componente y pseudoelementos, el fill real de los SVG cargados desde el mismo origen y el fondo opaco efectivo. Comprueba geometría/máscara/visibilidad, opacidad y ausencia de filtros/blending en ancestros; no se reduce a un par de tokens aislado. Marca y thumb On: **6,827:1**; thumb Off: **14,15:1**. Contorno Switch contra fondos: mínimo **5,642:1**. Los valores de foco y el detalle por superficie/estado están conservados en evidence.json. Todos los gráficos/focos relevantes deben alcanzar 3:1 y el texto normal 4,5:1. Se inspeccionan visualmente capturas seleccionadas; no se afirma comparación pixel-perfect automática ni contraste de cada píxel antialias.

Las pruebas de teclado/puntero ejercitan los inputs reales. Tras reset, checked, FormData y señales vuelven a los valores predeterminados. En forced-colors desaparecen ambas capas y los fondos SVG; el input nativo sigue alternando. Reduced-motion no introduce movimiento.

### Observación de contrato nativo, fuera de la corrección visual

Una aserción inicial esperaba cuatro callbacks React al alternar con Espacio, hacer reset y volver a alternar con clic. La reproducción mostró **dos callbacks React y cuatro eventos change nativos**, tanto en Choice decorado como en una referencia React de inputs nativos sin decoración. La espera de render no resuelve la diferencia. En una carga nueva, dos clics sí producen dos callbacks React; los tests exigen ese resultado y la equivalencia posterior al reset.

No se modifica el componente para fabricar eventos, tocar trackers privados o mantener una segunda fuente de estado. Se conserva el contrato previo y se registra `CHOICE-REACT-RESET-01` como limitación observada. No se presenta una prueba recortada de eventos como garantía universal. Los formularios controlados de PR05a conservan su reset propiedad del consumidor. Cambiar el comportamiento de React requeriría una investigación independiente, fuera de este alcance.

## Seguridad y CI

Audit completo local ejecutado con dev: cuatro hallazgos high del advisory autorizado, ninguno adicional; el CLI devuelve 1 porque esta rama local no está autorizada para aceptación. Exposición devuelve el mismo rechazo de contexto. No se simulan variables GitHub ni se usa otra rama para eludirlo. La inspección del artefacto y aceptación técnica obligatorias deben pasar en el PR interno real, en Linux, sobre el último commit y ligadas al mismo SHA.

SEC-PR01-01 sigue **aceptada temporalmente, no corregida**, hasta **31/10/2026 23:59:00 America/Lima = 01/11/2026 04:59:00 UTC**. Grafo, hash del lock y contextos originales intactos; cualquier hallazgo nuevo, anomalía o vencimiento bloquea la aceptación. La revisión del 24/10 existente continúa programada, sin crear duplicados.

La descripción de PR #10 conserva los enlaces y resultados de foundation/dependencies/secrets/unit del HEAD aprobado. La evidencia Linux posterior al merge se registra en el cierre; las capturas Windows no se presentan como ejecuciones Linux. CI fallido o ausente sigue siendo bloqueo. No se altera ningún gate para obtener un resultado favorable.

El [primer job de secretos](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39206627241/job/117910773372) bloqueó correctamente dos coincidencias generic-api-key en evidence.json. Eran valores SHA-256 del archivo tokens.generated.css usados junto a su ruta como clave JSON, no credenciales: ambos se recalcularon desde la fuente y coincidieron. Se pasó a registros explícitos `{ path, sha256 }`, conservando todos los hashes, como en la evidencia histórica de PR05b. El escáner original verificó el directorio sin hallazgos; no se introdujo ninguna exclusión ni modificación de scripts/política. Como el job inspecciona historial, se reemplazó el único commit nuevo de esta rama mediante force-with-lease del SHA remoto esperado; el resultado inicial no se presenta como aprobado ni se altera develop/main. La nueva ejecución completa debe validar el commit definitivo.

## Estado de los hallazgos y pendientes

A11Y-PR05-CHECKBOX-01 y A11Y-PR05-SWITCH-01: **cerrados formalmente tras la aprobación del PR #10 y la verificación Linux satisfactoria del squash en develop**. Véase el cierre posterior al merge. No se cerraron durante el diagnóstico ni antes de obtener evidencia.

PR05 global permanece abierto. Axe-core no instalado; AXE-PR05-01, lectores de pantalla reales, zoom nativo, Safari/Firefox y dispositivos físicos siguen pendientes. Las pruebas AX/CDP, captura y cálculos no equivalen a axe ni a conformidad WCAG integral. D05, D08, PR06 y el bloqueo comercial siguen abiertos. Sin despliegue o integraciones externas.

## Inventario del cambio

Choice.tsx, fields.module.css; manifiesto separado choice-accessibility.json; tests/shared-ui.test.ts y fixture modal-feedback-preview.tsx; nuevo verificador check-choice-accessibility.mjs y conexión/resumen en los dos verificadores PR05b existentes; este informe, registro de accesibilidad y evidencia nueva. Los manifiestos fuente y los SVG anteriores se conservan byte a byte.

Reproducción: npm test, npm run lint, npm run typecheck, npm run design:verify, npm run public:verify, npm run ui:verify, node scripts/verify-modal-feedback.mjs, npm run test:boundary, build/smoke/pages:verify y los controles de CI existentes. Las fixtures se eliminan al terminar y están prohibidas en producción por prebuild/smoke. No ejecutar verificadores Next simultáneamente porque comparten .next.

## Cierre autorizado · PR #10

El 19/10/2026 se reconfirmaron HEAD `d9ac1185838ca68f2c6b3203c7532e3dc21a7782`, destino develop, ausencia de conflictos y cuatro jobs satisfactorios. Se verificó mediante diff que dependencias, lockfile, tokens, SVG, fuentes, Button, Alert, ModalCore, workflows y controles SEC seguían intactos. Tras marcar Ready for Review se ejecutó Squash and Merge con referencia a [PR #10](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/10).

**Squash y HEAD de integración de develop: [`933612d31acd17edd9befa5c89ef8291cdfe323b`](https://github.com/KevinhosUTP/n8n-qa-selfhosted/commit/933612d31acd17edd9befa5c89ef8291cdfe323b).** Su árbol coincide exactamente con el HEAD aprobado del PR. La ejecución push real sobre ese SHA terminó satisfactoriamente:

| Job posterior al merge | Evidencia comprobada |
| --- | --- |
| [foundation](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160476/job/117918463218) | success: instalación limpia, lint, **363 tests**, navegador Linux PR02–PR05b y Checkbox/Switch a siete anchos, frontera cliente/servidor negativa, TypeScript, exposición, build sin credenciales, smoke y páginas PR04 en standalone, inspección Linux |
| [dependencies](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160476/job/117919762082) | success: audit completo con dev, **cuatro high conocidos, ninguno adicional**; aceptación temporal tras foundation/Linux, sin exclusiones ni relajación |
| [secrets](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160476/job/117918463515) | success: **68 commits** escaneados, sin fugas |
| [unit Python/Streamlit](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39209160528/job/117918463931) | success: compileall, **15 regresiones Python** y smoke inicial Streamlit |

Artefacto Linux: BUILD_ID `-BPAcWpUuZCh9eLk_JwRB`; inventario `e54d8610ef98cef65cca874046376e486391ccf49c5f982d6e1f1379e6e4c075`; `linuxVerified: true`. Auditoría y artefacto coinciden en ese inventario y en la revisión del squash. Se inspeccionan standalone, assets y trazas, incluidos enlaces e imports; las declaraciones devDependencies conservadas como metadatos no equivalen a código ejecutable incluido. La integridad de los recursos originales continúa cubierta por las suites.

SEC reconoce `event: push`, `refs/heads/develop` y `KevinhosUTP/n8n-qa-selfhosted/.github/workflows/frontend-checks.yml@refs/heads/develop`, sin simular variables. `acceptanceGate: verified-linux-foundation`; lockHash y política originales conservados. SEC-PR01-01 permanece temporalmente aceptada, **no corregida**, con vencimiento **31/10/2026 23:59:00 America/Lima (01/11/2026 04:59:00 UTC)**. Cualquier hallazgo nuevo, anomalía o vencimiento bloquea CI.

La prueba Linux reprodujo `CHOICE-REACT-RESET-01`: dos callbacks React frente a cuatro change nativos tanto en Choice como en la referencia sin decoración. Sigue documentado y no se declara corregido. La [captura forced-colors](a11y-choices-evidence/README.md#estado-interactivo-de-la-captura-forced-colors) muestra una interacción real: el Checkbox del grupo inicialmente Off está activado y enfocado tras Espacio; el Switch de ese grupo sigue Off. Los títulos describen los grupos iniciales. No se presenta como estado inicial, tema High Contrast ni captura posterior al merge.

Con la aprobación formal y esta evidencia posterior al merge, **A11Y-PR05-CHECKBOX-01 y A11Y-PR05-SWITCH-01 quedan cerrados**. PR05 global, AXE-PR05-01, lectores de pantalla, zoom nativo y plataformas adicionales siguen abiertos. Axe-core no está instalado; no se declara conformidad WCAG integral. Este cierre modifica exclusivamente documentación. El SHA documental final y su CI completo se registran en PR #10 al terminar, sin atribuir a esa ejecución futura un resultado aún no obtenido. No se modifica main, PR #3, backend, infraestructura o proveedores; sin despliegue ni PR06.
