# PR05b · Dialog, Drawer y Toast

## Alcance y autorización

Base remota y local reconfirmada: `cac070e25b1b24823df84e17c6aca1987c3a9d29` de develop, árbol limpio antes de crear `codex/kevolint-pr05b-modal-feedback`. Implementación autorizada de primitivas compartidas, adaptador del drawer público y revisión visual Checkbox/Switch. Entrega inicial como Draft PR hacia develop; PR #9 integrado después de aprobación formal de merge. Sin despliegue ni PR06.

Axe-core: alternativa A seleccionada por el usuario, **instalación expresamente no autorizada en PR05b**. AXE-PR05-01 y PR05 global permanecen abiertos. Incorporarlo requiere investigación/remediación de SEC-PR01-01 y aprobación independiente de dependencias/lockfile. CDP y el árbol AX no sustituyen axe ni lectores de pantalla.

## Cierre autorizado de PR05b · 18/10/2026

Se reconfirmó el HEAD exacto `ab9f7b2d0a4324a1521426905293fafbdd3068fe`, destino develop, ausencia de conflictos y los cuatro jobs aprobados (foundation, dependencies, secrets, unit). Dependencias, lockfile, política/script SEC, Button y Alert conservaron los bytes versionados de la base. PR #9 pasó de Draft a Ready for Review y se integró mediante Squash and Merge protegido por el SHA esperado.

- [PR #9 integrado](https://github.com/KevinhosUTP/n8n-qa-selfhosted/pull/9).
- [Squash `0898ae4338d9747250fbdaaefae07ff8b5cbad39`](https://github.com/KevinhosUTP/n8n-qa-selfhosted/commit/0898ae4338d9747250fbdaaefae07ff8b5cbad39), con referencia `(#9)`.
- Padre `cac070e25b1b24823df84e17c6aca1987c3a9d29`; árbol idéntico al HEAD aprobado del PR.

Los workflows se ejecutaron por push a develop sobre el squash `0898ae4338d9747250fbdaaefae07ff8b5cbad39`. Los cuatro jobs terminaron con success al primer intento:

| Job / workflow | Resultado comprobado en logs |
| --- | --- |
| [Frontend · foundation](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39177183084/job/117822153620) | Success: instalación limpia, lint, **356 pruebas frontend**, TypeScript, frontera cliente/servidor, build sin credenciales y smoke |
| Frontend · navegador Linux | Success: PR02 14 muestras/32 estados; PR03 siete anchos y ciclo del drawer; PR05a controles/formularios; PR05b siete anchos con ModalCore/foco/scroll/formularios/Toast; PR04 56 muestras/32 frames y ocho páginas sin JS |
| Frontend · recursos y artefacto | Success: tokens, SVG/fuente originales, exclusión de fixtures, exposición y standalone/assets/trazas Linux; linuxVerified true |
| [Frontend · dependencies](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39177183084/job/117823051129) | Success: audit completo; solo los cuatro nodos high del GHSA aprobado, sin hallazgos adicionales; aceptación temporal, no corrección |
| [Frontend · secrets](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39177183084/job/117822153457) | Success: 65 commits escaneados, sin secretos |
| [Python/Streamlit · unit](https://github.com/KevinhosUTP/n8n-qa-selfhosted/actions/runs/39177183124/job/117822153340) | Success: compileall, **15 regresiones Python** y smoke inicial Streamlit |

Artefacto y audit coinciden en la revisión del squash y en el inventario `96d8835dc90696df6059a57366b0a6492dab84caeb4a173797e7379142578fcb`. BUILD_ID Linux `-kC1V_2nAam2Xa9OYRKSa`. El control reconoce event push, refs/heads/develop y el workflow autorizado frontend-checks.yml@refs/heads/develop; acceptanceGate verified-linux-foundation. Conserva hash del lockfile, cadena, severidad permitida, vencimiento y rechazo ante anomalías, sin modificar la política.

No hubo fallos reales ni reintentos en CI postmerge. El registro de PR #9 identificará por separado los resultados del HEAD documental final.

Este cierre cambia únicamente el informe técnico y el registro de accesibilidad. El SHA exacto y CI del HEAD documental final se registran en PR #9 después de publicar, evitando commits que intenten autorreferenciar su propio SHA. No se modifican funcionalidades, recursos, dependencias, controles o políticas.

**PR05b completado; PR05 global permanece abierto.** AXE-PR05-01 requiere aprobación independiente para axe-core; A11Y-PR05-CHECKBOX-01 y A11Y-PR05-SWITCH-01 mantienen la corrección visual pendiente. Lectores de pantalla, zoom nativo y plataformas adicionales siguen sin verificarse de forma integral. No se declara conformidad WCAG integral ni se inicia PR06. SEC-PR01-01 continúa aceptada temporalmente, no corregida, hasta el 31/10/2026 23:59 America/Lima, sin ampliación. No hay despliegue ni autorización comercial.

## Componentes y contratos

| Pieza | Contrato y referencia |
| --- | --- |
| ModalCore | Único propietario de showModal/close, contención del foco, fondo inerte, scroll y limpieza. Sin rutas, marca, cola o apilamiento |
| Dialog | open controlado, onCloseRequest, título obligatorio, descripción opcional, contenido/acciones, foco inicial y retorno. 4:517 y sus ocho composiciones; no implementa borrado, sesión, preferencias ni pagos |
| Drawer | Mismo contrato de Dialog; panel de filtros 114:14466/14518. Sin historial real ni API de posiciones/variantes inventadas |
| ModalCloseButton | Reutiliza Button nativo, type button; el consumidor puede cancelar el cierre con preventDefault. No sustituye submit o validación |
| ModalSurface | Adaptador PR03 con el nombre público, Cerrar menú, estilos existentes y M10 de 240 ms. PublicNavigation conserva sus bytes y responsabilidades |
| Toast | Única presentación neutral/success/warning/error, desde 4:585 y 16:380. Iconos originales de 24 px ya incluidos en PR04 |
| ToastRegion | Región status polite/atomic estable, inicialmente vacía. Mensajes inmutables identificados por evento; el consumidor controla reemplazo y retirada |

Los motivos de solicitud son escape, scrim, button, form, native y open-rejected. La prop open pertenece al consumidor; una solicitud puede rechazarse conservando el modal y el bloqueo. Un cierre nativo externo se reconcilia con ese estado. Las props open=false, navegación, breakpoint y desmontaje son transiciones/lifecycle del propietario; no generan falsas interacciones.

Las aperturas simultáneas se rechazan antes de tocar el foco o los estilos del propietario activo. No hay cola ni reapertura automática diferida. El destino alternativo del foco, si desaparece el disparador, corresponde al consumidor. El adaptador público conserva el retorno al disparador al cancelar, main después de navegación efectiva y marca visible al pasar a desktop.

Los formularios conservan required, readonly aplicable, disabled, radio nativo, reset y submit. method=dialog y formmethod=dialog pasan por el mismo callback controlado, conservando returnValue y respetando preventDefault del consumidor; no se envían datos a un backend. Sin controles enfocables, el contenido interior puede recibir foco y Escape permite salir. No se añade tabindex al elemento dialog.

Toast no roba foco ni incorpora operaciones de negocio, confirmaciones ficticias, auto-dismiss, cola global, persistencia o animaciones. El mismo evento sin cambios no produce mutaciones del contenido anunciado. Esto se comprueba en DOM; los anuncios hablados reales siguen pendientes. Cada consumidor debe mantener una única región estable en el contexto accesible correspondiente, evitando duplicarla con Alert o ubicarla en un fondo inerte.

## Fidelidad y recursos

`design-system/modal-feedback.json` registra referencias, adaptaciones y hashes de los iconos reutilizados (3:15/3:18). Ningún SVG original se redibuja, sustituye o modifica. Manifiestos originales, 61 tokens, generador, Inter/OFL y recursos previos permanecen intactos.

La implementación usa CSS Modules y tokens existentes. Dialog conserva superficie, radio 12, padding 24, gap 12 y título H3 24/32 sin heredar el tracking de H2. Drawer conserva raised, radio 16, padding 24 y gap 16. Toast conserva raised, radio 12, padding 16, gap 12, icono 24 y etiqueta 14/20. Las alturas de referencia son mínimos; se permite crecimiento y scroll interior sin recortar texto.

Adaptaciones explícitas:

- Las composiciones son demostraciones técnicas identificadas. Los textos y acciones disabled no afirman que una operación esté implementada. La fixture de concurrencia está separada de la composición visual básica de Dialog.
- El panel de filtros se presenta centrado en la superficie modal; no se añade una API lateral ni animación nueva. Sus controles reutilizan HistoryFilterField/Select nativo; popup y flecha dependen del navegador.
- El modelo CSS de borde interior puede introducir diferencias de un píxel respecto de las medidas del auto layout de Figma. No se declara comparación pixel-perfect automática.
- Los contenedores y botones crecen con texto largo. Dialog/Drawer compartidos y Toast no añaden movimiento; el drawer público conserva exactamente su CSS M10. Movimiento reducido mantiene foco y semántica.
- Los encabezados Off/On de la fixture identifican muestras; no son una corrección ni una nueva señal dentro de Checkbox/Switch.

Se contrastaron los contextos y renders originales de Figma con capturas reales Windows. Las evidencias incluyen Dialog, Drawer, formulario, Toast y Off/On con/sin foco a 320/390/768/1440, más altura reducida. Se inspeccionaron visualmente muestras seleccionadas; las comprobaciones geométricas cubren los siete anchos. No se afirma inspección humana exhaustiva de cada píxel/frame.

## Verificaciones ejecutadas

| Área | Evidencia local |
| --- | --- |
| Instalación y estáticos | npm ci sin cambios de versiones; lint, TypeScript y 61 tokens aprobados |
| Vitest | **356 pruebas**: las 339 existentes y 17 nuevas; semántica, contratos, regiones, recursos y aislamiento de fixture |
| Navegador PR05b | Siete anchos 320/390/767/768/1023/1024/1440; nombres AX, geometría, targets 44 y contraste de texto/foco efectivos |
| Modal | Teclado/puntero, Escape/scrim/botón, ciclos de foco, fondo inerte, contenido sin controles, cierre denegado, concurrencia rechazada, desmontaje/reapertura y retorno alternativo |
| Formulario | Validación requerida, readonly/disabled, radio/flechas, reset, submit cancelado, method=dialog, formmethod y returnValue controlados |
| Scroll | Restauración exacta de propiedades/prioridades inline y posición, incluido desmontaje; scroll interior y cierre alcanzable a altura 320 |
| Toast | Región estable previa al evento, un único live surface, sin mutaciones al repetir el mismo evento, sin robo de foco y retirada por el consumidor |
| PR02 | 14 muestras/32 estados: marca, Button, contraste, recursos, movimiento reducido |
| PR03 | Siete anchos: navegación real, misma ruta, historial/modificadores, Escape/cancelación, foco, scroll, breakpoint y desmontaje |
| PR05a | Siete anchos, controles/formularios/reset/AX/contraste originales |
| PR04 | 56 muestras/32 frames, ocho páginas sin JS, FAQ, búsqueda local/GET, CTA honestos y movimiento |
| Build/smoke | Frontera cliente/servidor, build sin credenciales, recursos originales, rutas públicas y 404 de fixtures/sign-in/sign-up |
| Python/Streamlit | Compileall, **15 regresiones** y smoke inicial aprobados en el entorno existente; sin cambios del backend |

Las pruebas de navegador usan Chrome/Edge instalado y CDP, sin instalar paquetes o navegadores. Los tests Node/SSR no se presentan como validación real del foco. Las fixtures se crean temporalmente; prebuild rechaza su presencia y smoke exige 404. No son rutas publicadas del producto.

El primer intento sandbox Windows no pudo crear las junctions de tres pruebas existentes y el Python global no tenía los módulos del proyecto. La suite completa pasó fuera de ese aislamiento y con el entorno Python ya instalado. No se omitieron pruebas ni se añadieron paquetes para resolverlo.

## Seguridad y CI

Dependencias, lockfile, Button, Alert, campos, SVG, política/script SEC y workflow Python conservan los bytes versionados de la base. El workflow frontend solo añade la ejecución del navegador PR05b: mantiene todos los pasos previos, jobs, permisos, límites de 15 minutos y el vínculo audit/artefacto Linux.

Audit completo local: solo cuatro nodos high, un único GHSA aprobado; sin hallazgos adicionales. Los comandos de seguridad rechazan la rama local no autorizada y no conceden aceptación técnica. No se simulan variables GitHub. El lockfile Git LF conserva `aa92474f1c300f4dd062af76381c793bef5f4e9440901d17f030b374df5054a5`; el checkout Windows CRLF no constituye prueba de ese hash físico ni de Linux.

SEC-PR01-01 sigue **aceptada temporalmente, no corregida**, hasta 31/10/2026 23:59 America/Lima (01/11/2026 04:59 UTC), sin extensión. Nuevos hallazgos, cambios de grafo/hash/contexto, vencimiento o falta de evidencia Linux deben bloquear la aceptación. Su investigación/remediación será independiente y necesita autorización nueva.

Un escaneo adicional indiscriminado del directorio incluyó metadatos ignorados de .next y señaló claves internas generadas por Next (preview/RSC/server references); no se introducen credenciales ni se añaden exclusiones al escáner. El escaneo Git del contenido propuesto y el job secrets del último commit son las comprobaciones de entrega del código versionado.

La entrega inicial se validó con foundation, dependencies, secrets y unit satisfactorios en el PR interno hacia develop sobre su último commit. Los resultados posteriores al merge se registran en la sección de cierre y en PR #9, distinguiendo captura local, CI del squash y CI del HEAD documental final.

## Pendientes y límites

- AXE-PR05-01: alternativa A elegida, instalación y autorización independientes pendientes; PR05 global abierto.
- Checkbox/Switch: revisión visual ejecutada, sin señal de marca/desplazamiento identificada; propuesta de corrección pendiente de aprobación. Véase accessibility-register.md.
- Lectores de pantalla reales, zoom nativo, Safari/Firefox y táctil físico siguen pendientes. Árbol AX y CSS zoom no sustituyen esas verificaciones. No se declara conformidad WCAG integral.
- D05, D08, PR06 y bloqueo de despliegue comercial siguen vigentes. No se habilitan Light ni High Contrast completos.

PR05b está integrado por autorización formal; PR05 global continúa abierto. Sin despliegue ni inicio de PR06.
