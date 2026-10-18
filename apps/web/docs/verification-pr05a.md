# PR05a · Campos y componentes compartidos

Base remota y local reconfirmada antes de crear la rama: `70dd2f2a25ec6dd833154f59d647899b5894897e` de develop; árbol limpio. Rama: `codex/kevolint-pr05a-shared-fields`. La entrega inicial fue un Draft PR; PR #8 quedó integrado en develop por autorización formal posterior. Sin despliegue. PR05b y PR06 no iniciados.

## Cierre autorizado de PR05a · 18/10/2026

Antes del merge se reconfirmaron el HEAD exacto `aa40682d2e1273ff5f46db087acdf2fd3cba0b19`, destino develop, ausencia de conflictos y los cuatro jobs aprobados: foundation, dependencies, secrets y unit. Button (componente/estilos/clases), ModalSurface, dependencias, lockfile, política/script de seguridad, workflow Python, tokens y recursos previos conservaron los bytes versionados de la base autorizada.

PR #8 se marcó Ready for Review y se integró mediante Squash and Merge protegido por el SHA esperado:

- [PR #8 integrado](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/8).
- [Squash `a302aba410cbc68ab2f94f61983fdf48d58785aa`](https://github.com/KevinhosUTP/n8n-qa-selfhosted/commit/a302aba410cbc68ab2f94f61983fdf48d58785aa), con referencia `(#8)` en el mensaje.
- Padre `70dd2f2a25ec6dd833154f59d647899b5894897e`; árbol idéntico al HEAD aprobado.

Los workflows siguientes se ejecutaron por push a develop sobre el squash `a302aba410cbc68ab2f94f61983fdf48d58785aa`, completados con success al primer intento:

| Job / workflow | Resultado confirmado en logs |
| --- | --- |
| [Frontend · foundation](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39159856109/job/117770680434) | Success: instalación limpia, lint, **339 pruebas frontend**, TypeScript, frontera cliente/servidor, build sin credenciales y smoke |
| Frontend · navegador Linux | Success: PR02 (14 muestras/32 estados), PR03 (siete anchos y ciclo completo del drawer), PR05a (siete anchos, formularios/teclado/reset/AX/contraste) y PR04 (56 muestras/32 frames, ocho páginas sin JavaScript, FAQ y búsqueda local/GET) |
| Frontend · recursos y artefacto | Success: integridad de los 61 tokens, SVG originales/exportaciones y fuente; fixture PR05a devuelve 404 en standalone; exposición e inspección física de standalone/assets/trazas Linux aprobadas |
| [Frontend · dependencies](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39159856109/job/117771539319) | Success: audit completo con desarrollo, solo cuatro nodos high del GHSA aprobado, aceptación temporal y no corrección; sin hallazgos adicionales |
| [Frontend · secrets](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39159856109/job/117770680331) | Success: 62 commits escaneados, sin secretos |
| [Python/Streamlit · unit](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39159856126/job/117770680277) | Success: compileall, **15 regresiones Python** y smoke inicial Streamlit |

Los controles reconocieron event push, refs/heads/develop y el workflow autorizado `KevinhosUTP/n8n-qa-selfhosted/.github/workflows/frontend-checks.yml@refs/heads/develop`. Artefacto y audit coinciden en revisión del squash e inventario `fbd7b6bfa7c9d99b7e1c5e9318de75dcea0ebf090f96ab720d2805aba1d0dcb9`; BUILD_ID Linux `imt5QAEgrOwxqxD_OJHA7`, linuxVerified true. Hash del lockfile autorizado y vencimiento original conservados. La aceptación solo se concedió tras foundation/Linux satisfactorios.

Este cierre añade únicamente documentación; los resultados del HEAD documental final se verificarán y enlazarán en el registro de PR #8 para evitar commits sucesivos que autorreferencien el informe.

**PR05a completado; PR05 global abierto.** Se conserva el gate axe sin resolver y se añade el [registro de accesibilidad pendiente](accessibility-register.md), con revisiones específicas de diferenciación visual de Checkbox y Switch seleccionado/no seleccionado sin depender exclusivamente del color. Estas revisiones no se presentan como ejecutadas ni corregidas. No se cambian SVG, estilos o componentes; cualquier corrección visual necesitará aprobación separada. Se mantienen lectores de pantalla, zoom nativo, navegadores adicionales y dispositivos físicos pendientes.

## Matriz implementada y correspondencia

| Componente | Figma original | Contrato y alcance |
| --- | --- | --- |
| Field / Input | 3:257; variantes 3:227/232/237/242/247/252 | Label persistente, hint/error asociados, atributos/ref/eventos nativos, required, disabled, readonly; éxito visual igual a su referencia, sin validar reglas de negocio |
| SelectField | 16:277; 16:268/271/274 | Un select nativo de selección simple; label, opciones disabled, defaultValue/value, required, ref y eventos; sin readonly ficticio |
| Radio / Checkbox / Switch | 16:251 / 4:524 / 16:258 | Input nativo con asociación de label y estados Off/On; Switch conserva checkbox de formulario con role switch; grupos de radio a cargo del consumidor mediante fieldset/legend |
| TextLink | 16:267; 16:259/261/263/265 | Enlace Next real; variante disabled sin href, callbacks ni tab stop. No reemplaza PublicNavLink |
| Badge | 3:226 | Cinco tonos originales, texto e icono, no interactivo; referencia de 32 px |
| Card | 3:275 y estructura coincidente de tarjetas | Solo superficie/borde/radio/padding; sin KPI, rol interactivo o copia de datos comerciales |
| Alert | 3:368 | Cuatro tonos, título/contenido; anuncio desactivado por defecto y opcional polite/assertive, sin robar foco |
| EmptyState | 3:422 | Icono original, encabezado h2/h3, descripción y acción proporcionada por consumidor; no inventa URL privada |
| Skeleton | 3:436 | Tres bloques estáticos originales; aria-hidden. El consumidor controla aria-busy y el texto de carga; sin valores ficticios |
| HistoryFilterField | 106:1464 | Wrappers Search/Select, Default/Focus/Applied, mismos Input/Select internos |
| ReportSelect | 199:1047 | Mismo Select interno, Default/Focus/Applied; 12 px a 320 y 14 px en otras referencias |

No se reconstruyen Button ni BrandLogo. PublicNavLink, ModalSurface, PublicNavigation, PublicFaq, HelpSearch y todas las composiciones editoriales permanecen sin cambios. No se crea Toast, Dialog, Drawer compartido ni lógica de historial/informes.

## Arquitectura y uso

Imports directos desde `src/components/ui/` y `ui/filters/`, sin barrel general. Field centraliza label/mensajes e IDs estables; InputControl y SelectControl concentran los controles reales. Los wrappers solo seleccionan presentaciones respaldadas por Figma. Choice comparte la mecánica nativa de radio/checkbox/switch. Los consumidores mantienen sus estados controlados, callbacks de reset, opciones y reglas de validación. Los componentes no duplican valores en estado interno ni incorporan persistencia o acceso a servicios.

Los labels son texto obligatorio; hints y errores generan aria-describedby sin eliminar descripciones externas. Los errores se asocian mediante aria-invalid y texto visible, sin anuncios duplicados automáticos. Los estados focus/hover provienen de interacción real, no de una prop que finja foco. Readonly se ofrece solo en Input. Select no implementa múltiples opciones, combobox propio, menú paralelo ni búsqueda de catálogo. Los atributos nativos siguen siendo responsabilidad de un consumidor correcto.

Card es un div estructural. Sus títulos/acciones los compone el consumidor; las tarjetas editoriales no se migran porque sus contratos, alturas y contenido son diferentes. Los estilos compartidos usan CSS Modules, variables existentes e Inter local. La revisión React conserva componentes pequeños, IDs estables, límites cliente para campos, sin efectos ni estado derivado innecesario y sin importar una biblioteca nueva.

## Recursos y fidelidad visual

Los 61 tokens, generador, manifiestos originales, fuente/licencia, 24 SVG de marca y recursos de PR01–PR04 quedan intactos. `design-system/shared-ui.json` conserva IDs de componentes y procedencia/hash/geometría de catorce exportaciones SVG directas de los slots originales de Figma mediante exportAsync SVG_STRING. No se redibujan iconos ni se cambian sus paths. Se reutiliza también el archivo original file.svg de PR04. Las nuevas exportaciones mantienen sus bytes y dimensiones de 16/20/22/40×20; no se reducen mediante CSS SVG exportados a otro tamaño.

Comparación realizada con los contextos y renders originales obtenidos en el diagnóstico: Input, Select, Radio, Checkbox, Toggle, Link, SeverityBadge, Alert, KPIStat, EmptyState, Skeleton, FilterField y ReportSelect. La evidencia real Windows incluye veinte PNG: vista completa, campos, formulario, filtros y feedback a 320/390/768/1440. Las capturas y hashes se conservan en `pr05a-evidence/`.

Adaptaciones explícitas:

- El Select conserva menú y flecha nativos del navegador en su presentación general. Tipografía y control cerrado siguen la referencia, pero popup, flecha, espaciado interno y aspecto disabled pueden variar por plataforma. History/Report conservan sus iconos originales de 20/16 px; la lista abierta sigue siendo nativa. No se afirma pixel-perfect del popup ni se implementa un segundo Select.
- Label required agrega «(obligatorio)». Hints, errores y textos largos aumentan la altura para no recortar contenido; las dimensiones Figma son referencias, no cajas rígidas. Badge resuelve su composición centrada de 32 px con padding vertical efectivo de 7 px para la línea de 18 px; no se modifica el manifiesto original ni se declara un token nuevo.
- Se conserva foco visible de 2 px con el patrón existente del proyecto. Los controles booleanos sin variante visual de error muestran mensaje asociado; no se inventan estados gráficos adicionales. La preferencia forced-colors del sistema devuelve los booleanos al render nativo; esto no habilita ni certifica un tema High Contrast de KevoLint.
- Los textos de la fixture son muestras identificadas. EmptyState no ejecuta una auditoría: su acción de muestra está deshabilitada. La fixture no se publica como ruta del producto.

Las capturas corresponden al árbol de trabajo anterior al commit de entrega, con base, navegador y hashes registrados; no se atribuyen al SHA final ni a Linux. GitHub Actions verifica de nuevo el último commit del PR. No se declara equivalencia pixel-perfect ni conformidad WCAG integral.

## Verificaciones

| Área | Resultado local ejecutado |
| --- | --- |
| Instalación limpia | npm ci --no-audit --no-fund; audit completo separado, sin cambiar versiones/lockfile |
| Lint / TypeScript | Aprobados |
| Vitest | **339 pruebas**: las 301 existentes y 38 nuevas, incluidas integridad SVG, contratos/semántica y exclusión de fixture |
| PR02 / PR03 | Suites existentes aprobadas: 14 muestras/32 estados y siete anchos con ciclo completo del drawer |
| PR05a navegador | Siete anchos: 320/390/767/768/1023/1024/1440; veinte capturas seleccionadas; targets, ausencia de overflow, geometría original, contraste de texto/foco y feedback |
| Interacción nativa | Tab/disabled/foco, readonly, Space, label click, flechas de radio/select, required, submit, FormData, reset nativo, valores controlados y reset del consumidor |
| Semántica y movimiento | Árbol AX con nombres/roles, actualización explícita de status sin robo de foco, navegación de TextLink, preferencia reducida, altura 320 y reflow CSS 200% |
| Sin JavaScript | Contenido SSR, labels y opciones presentes sin ejecución; no se presenta como prueba de todas las interacciones sin JS |
| Python / Streamlit | **15 regresiones**, compileall y smoke inicial aprobados |
| Audit completo local | Solo cuatro nodos high conocidos del único GHSA autorizado; aceptación correctamente denegada en esta rama local. Exposición/artefacto también rechazan ese contexto; no acreditan inspección Linux |

Build/smoke, frontera cliente/servidor, typecheck y las 56 muestras standalone PR04 aprobaron; las ocho páginas también conservan su contenido sin JavaScript, FAQ, búsqueda GET/local, destinos honestos y ausencia de errores. El CI final del PR, incluido el artefacto Linux, es obligatorio y sus enlaces/resultados se registrarán en la descripción del Draft PR, evitando un commit autorreferenciado en este informe.

La suite PR05a usa Chrome/Edge instalado y CDP, como las verificaciones existentes; no instala paquetes ni navegador. Crea una ruta temporal propia, la retira al finalizar y limpia solo sus tipos generados. Prebuild rechaza la ruta si permanece y el smoke exige 404 en producción. El workflow añade únicamente ui:verify y conserva todos los jobs/steps, límites de 15 minutos, permisos y condiciones previos.

Incidencias reproducibles: el sandbox Windows no permitió las junctions de tres fixtures de seguridad; la repetición elevada aprobó sin cambios de controles. El TestClient Python quedó bloqueado en sandbox y se interrumpió esa ejecución; fuera del sandbox aprobó. La revisión automática de una ejecución falló por cuota temporal y se reintentó tras la indicación del usuario. La preparación de imágenes lazy y los contenedores grid/fieldset de la fixture se ajustaron sin reducir las aserciones; una captura de filtros se añadió mientras una ejecución usaba la copia anterior, esa ejecución falló y la suite se reinició con archivos sincronizados.

## Seguridad, gates y riesgos pendientes

SEC-PR01-01 permanece **temporalmente aceptada, no corregida**, responsable `KevinhosUTP`. La política, script de seguridad, dependencias, lockfile y workflow Python no cambian. Hash autorizado del lockfile versionado: `aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5`. Vencimiento original: **31/10/2026, 23:59 America/Lima**, equivalente a `2026-11-01T04:59:00Z`; sin renovación o ampliación. No se simula contexto GitHub. Solo CI en el contexto autorizado de PR interno hacia develop o push a develop puede acreditar aceptación tras foundation e inspección Linux satisfactorios del mismo commit; hallazgos adicionales/anomalías bloquean.

**Axe sigue pendiente del backlog original**, no está instalado ni sustituido por CDP/AX, contraste o teclado. PR05 no queda cerrado. Su resolución necesita una decisión expresa antes del cierre global. PR05b no está autorizado en esta entrega.

No se probaron lectores de pantalla, dispositivos físicos, Safari/Firefox, zoom nativo manual ni todas las combinaciones de sistema/navegador. CSS zoom no equivale a zoom nativo. Los anuncios del lector no quedan demostrados por el árbol AX. El popup nativo puede requerir verificaciones adicionales por plataforma; las capturas headless no son métricas de campo. Light y High Contrast completos continúan deshabilitados; ISSUE-HC-01 conserva su corrección aislada y regresiones previas.

D05, D08, PR06 y el bloqueo de despliegue comercial continúan abiertos. El merge de PR05a se autorizó por separado y quedó registrado arriba. No hay despliegue ni modificaciones en main, PR #3 histórico, FastAPI, motor QA, infraestructura o proveedores. Los componentes son infraestructura de presentación y formularios, no funcionalidades comerciales.
