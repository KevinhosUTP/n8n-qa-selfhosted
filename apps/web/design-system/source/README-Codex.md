# KevoLint · START HERE / Codex

Entrega3C v1.0 ·2026-10-17 · Estado: preparado para revisión. La implementación requiere autorización posterior.

1. Lee Handoff-tecnico-KevoLint.md (o el HTML) y manifests/handoff-index.json.
2. Consulta matriz-rutas.csv y manifests/routes.json para las URLs aprobadas y sus frames exactos en1440/768/390/320. inventario-frames.csv contiene los363 frames; overlays/estados no crean rutas nuevas.
3. Reutiliza manifests/components.json y tokens.json. Inter es UI activa; R2/C3+W3 son SVG originales. No reconstruyas el wordmark ni migres fuentes globalmente.
4. Distingue DEMO, EXISTING_REPORTED, PROPOSED_NOT_IMPLEMENTED y FUTURE_PROVIDER_INTEGRATION. Solo GET /health y POST /api/v1/audits se reportan existentes; el wire schema no se verificó. Ninguna ruta API propuesta se puede consumir como si ya existiera.
5. Antes de PR10, concilia OpenAPI real, Clerk y contratos de cuota/idempotencia. Seguridad de cuotas, ownership, retención y pagos siempre en backend.
6. Sigue las15 etapas de backlog-PR.csv con gates y pruebas. PR13 se separa en lectura13a y pagos13b. Trabaja un incremento verificable cada vez.
7. Aplica matriz-QA.csv; pruebas reales están NOT_RUN. La aceptación manual de Figma Present de3B fue realizada por el usuario, no una integración Next.js.
8. Revisa ISSUE-HC-01: botón destructivo en High contrast con2,18:1. No publicar ese modo sin resolverlo.

Fuentes: [Figma aprobado](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=19-2), [BrandLogo](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=393-753), [nueva página de handoff](https://www.figma.com/design/TtOBuTKdNPw6dYXVUP2nmd?node-id=417-936).

Recursos:24 SVG originales y7 derivados/contenedores (PNG metadata/iconos eICO). No hay binarios de fuentes, secretos, TSX, CSS de producto, migraciones o archivos de repositorio. El HTML es documentación exportable, no una aplicación.

No modificar código, infraestructura, pagos, DNS, portfolio o pantallas aprobadas por la existencia de este paquete. Detenerse después de la revisión del handoff y pedir autorización de implementación.
