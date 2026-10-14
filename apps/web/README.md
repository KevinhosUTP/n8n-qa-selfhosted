# Interfaz Next.js — n8n QA (fase 7)

Interfaz de desarrollo para importar JSON de workflows n8n ficticios, enviarlos a FastAPI y visualizar hallazgos. No incluye todavía Clerk ni Sentry.

## Desarrollo local

- Node.js 22 o superior, acceso a GitHub y al entorno de desarrollo.
- Instalar con `npm install` dentro de `apps/web`.
- Copiar `.env.example` a `.env.local` y configurar acceso de prueba a la API. No subir el archivo al repositorio.
- Ejecutar `npm run dev` y abrir http://localhost:3000.
- Inspeccionar en Polypane: anchos 390px, 768px, 1280px y 1600px; teclado, labels, contraste, overflow y errores.

## Seguridad

- La conexión con FastAPI usa la ruta BFF `/api/audits` en el servidor de Next.js; jamás exponer Basic Auth a componentes de cliente.
- La ruta BFF permanece sin identidad de usuario: **no publicar esta aplicación hasta configurar Basic Auth en Coolify y después Clerk más autorización en FastAPI.**
- Máximo 1 MiB de cuerpo JSON; usar datos ficticios para pruebas. No subir workflows con credenciales reales.
- La ruta devuelve `503` si no se configuró QA_API_BASE_URL.
- No se almacenan workflows y no se envían cuerpos de auditoría a Sentry.
- Antes de producción: lockfile, validación adicional de entrada, rate limiting, Clerk, tests E2E, sanitización y pruebas de seguridad.

## Docker

El contexto de construcción será la raíz del monorepo, Dockerfile `/apps/web/Dockerfile`, puerto expuesto 3000.
