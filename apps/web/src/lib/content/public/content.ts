/** Editorial content adapted from Entrega 3C; business conditions remain proposals. */
export const motors = [
  { id: "security", icon: "shield", title: "Ciberseguridad e Integraciones", description: "Evidencias estáticas de riesgo." },
  { id: "architecture", icon: "workflow", title: "Arquitectura y Escalabilidad", description: "Señales de manejo de errores." },
  { id: "logic", icon: "data-flow", title: "Lógica y Flujo de Datos", description: "Referencias y conexiones del JSON." },
  { id: "prompt", icon: "agent", title: "Prompt Engineering y Agentes IA", description: "Señales estáticas de prompts y agentes." },
] as const;

export const plans = [
  { name: "Starter", quota: 10, days: 7, recommended: false },
  { name: "Pro", quota: 100, days: 90, recommended: true },
  { name: "Power", quota: 500, days: 180, recommended: false },
] as const;
export const commercialNotice = "Propuesta de catálogo · D05 pendiente. Precios, cuotas definitivas, conservación y condiciones comerciales no aprobados. Estas capacidades no están disponibles todavía.";

export const landingSteps = [
  { icon: "upload", title: "01 / Importa", description: "Exporta tu workflow desde n8n y carga el archivo .json." },
  { icon: "workflow", title: "02 / Audita", description: "Elige un perfil compatible y revisa cuatro categorías QA." },
  { icon: "check", title: "03 / Mejora", description: "Prioriza por severidad y aplica las recomendaciones manualmente." },
] as const;
export const howSteps = [
  { icon: "file", title: "01 / Exporta el JSON", description: "En n8n abre el workflow, entra al menú y descarga la exportación JSON." },
  { icon: "settings", title: "02 / Elige un perfil", description: "Selecciona únicamente un perfil n8n soportado por el motor. El selector público todavía no está implementado." },
  { icon: "search", title: "03 / Interpreta el informe", description: "Revisa la severidad, el motor, el nodo y la evidencia. Los filtros del informe pertenecen a una etapa posterior." },
  { icon: "check", title: "04 / Aplica mejoras", description: "Corrige manualmente en tu workflow y vuelve a auditar." },
] as const;

export const landingFaq = [
  { id: "connection", question: "¿Necesito conectar mi instancia de n8n?", answer: "No. El análisis del motor es estático sobre un JSON exportado; no ejecuta tu workflow ni requiere acceso a tu instancia. La importación desde esta web todavía no está disponible." },
  { id: "compatibility", question: "¿Puedo usar cualquier versión de n8n?", answer: "Solo deben anunciarse perfiles realmente validados. El perfil DEMO no asegura compatibilidad con una versión; la lista pública está pendiente de validación." },
  { id: "quota", question: "¿Cuándo se consume una auditoría?", answer: "La propuesta es consumir una por resultado completado, sin cobrar errores ni reintentos idempotentes. El control de cuotas todavía no está implementado y las condiciones finales requieren aprobación." },
] as const;
export const helpEntries = [
  { id: "export", question: "¿Cómo exporto un workflow?", answer: "En el editor de n8n abre el menú del workflow y elige descargar. El motor analiza ese JSON sin conectar tu instancia. La importación en esta web pertenece a una entrega posterior." },
  { id: "limits", question: "¿Qué límites tiene el archivo?", answer: "La API actual limita la solicitud a 1 MiB, 150 nodos y 2000 aristas. Requiere JSON con estructura de workflow válida; no hay un formulario público de importación todavía." },
  { id: "critical", question: "¿Qué significa un hallazgo crítico?", answer: "Es una señal prioritaria respaldada por evidencia. Revisa el nodo y la recomendación; no equivale a una explotación confirmada." },
  { id: "trial", question: "¿Cómo funcionarían las tres auditorías gratis?", answer: "La propuesta es ofrecer tres resultados completados por cuenta, una sola vez y sin tarjeta. No está disponible: identidad, cuotas y condiciones definitivas siguen pendientes." },
  { id: "version", question: "¿Qué versión de n8n puedo usar?", answer: "Solo perfiles realmente soportados. La demo no asegura una versión; las versiones finales están pendientes de validación." },
  { id: "storage", question: "¿Qué guardan del JSON?", answer: "La API inspeccionada no implementa persistencia. El historial por plan, la conservación, los logs y los respaldos necesitan validación antes de publicar una política definitiva." },
  { id: "account", question: "¿Cómo recupero mi cuenta?", answer: "La autenticación y la recuperación con Clerk pertenecen a PR06. No hay cuentas ni un formulario de recuperación operativos en este frontend." },
] as const;

export type HelpEntry = { readonly id: string; readonly question: string; readonly answer: string };
export function normalizeSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim(); }
export function filterHelp(entries: readonly HelpEntry[], query: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => { const text = normalizeSearch(entry.question + " " + entry.answer); return words.every((word) => text.includes(word)); });
}
export function readHelpQuery(value: string | string[] | undefined) { return (typeof value === "string" ? value : "").trim().slice(0, 120); }
