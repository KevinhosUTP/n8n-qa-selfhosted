# PR05b · Dialog, Drawer y Toast

## Alcance y autorización

Base remota y local reconfirmada: `cac070e25b1b24823df84e17c6aca1987c3a9d29` de develop, árbol limpio antes de crear `codex/kevolint-pr05b-modal-feedback`. Implementación autorizada de primitivas compartidas, adaptador del drawer público y revisión visual Checkbox/Switch. Entrega como Draft PR hacia develop; sin merge, despliegue ni PR06.

Axe-core: alternativa A seleccionada por el usuario, **instalación expresamente no autorizada en PR05b**. AXE-PR05-01 y PR05 global permanecen abiertos. Incorporarlo requiere investigación/remediación de SEC-PR01-01 y aprobación independiente de dependencias/lockfile. CDP y el árbol AX no sustituyen axe ni lectores de pantalla.

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

La aceptación final exige foundation, dependencies, secrets y unit satisfactorios en el PR interno hacia develop y sobre su último commit. Los enlaces/resultados reales se registran en la descripción del Draft PR después de publicar, evitando atribuir evidencia local a Linux o crear commits autorreferenciados del informe.

## Pendientes y límites

- AXE-PR05-01: alternativa A elegida, instalación y autorización independientes pendientes; PR05 global abierto.
- Checkbox/Switch: revisión visual ejecutada, sin señal de marca/desplazamiento identificada; propuesta de corrección pendiente de aprobación. Véase accessibility-register.md.
- Lectores de pantalla reales, zoom nativo, Safari/Firefox y táctil físico siguen pendientes. Árbol AX y CSS zoom no sustituyen esas verificaciones. No se declara conformidad WCAG integral.
- D05, D08, PR06 y bloqueo de despliegue comercial siguen vigentes. No se habilitan Light ni High Contrast completos.

PR05b se entrega para revisión formal, sin merge ni despliegue.
