import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 1_048_576;

export async function POST(request: NextRequest) {
  const base = process.env.QA_API_BASE_URL;
  const user = process.env.QA_API_BASIC_USER;
  const password = process.env.QA_API_BASIC_PASSWORD;
  if (!base || !user || !password) {
    return NextResponse.json({ detail: "Conexión de auditoría no configurada." }, { status: 503 });
  }
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json({ detail: "Se requiere application/json." }, { status: 415 });
  }
  const claimedLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(claimedLength) || claimedLength > MAX_BYTES) {
    return NextResponse.json({ detail: "El archivo excede 1 MiB." }, { status: 413 });
  }
  // Streaming: no confiar en Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ detail: "Falta contenido JSON." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) return NextResponse.json({ detail: "El archivo excede 1 MiB." }, { status: 413 });
      chunks.push(value);
    }
  } catch {
    return NextResponse.json({ detail: "No se pudo leer el archivo." }, { status: 400 });
  }
  const payload = Buffer.concat(chunks);
  try {
    const parsed: unknown = JSON.parse(payload.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        !("workflow" in parsed)) {
      return NextResponse.json({ detail: "Se requiere un objeto workflow." }, { status: 422 });
    }
  } catch {
    return NextResponse.json({ detail: "El JSON es inválido." }, { status: 400 });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(new URL("/api/v1/audits", base), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
      },
      body: payload,
      signal: controller.signal,
    });
    const data: unknown = await response.json();
    // Detalles genéricos para errores 5xx; evitar fugas de posibles datos sensibles.
    if (response.status >= 500) {
      return NextResponse.json({ detail: "El servicio de auditoría no está disponible." }, { status: 502 });
    }
    return NextResponse.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ detail: "No se pudo contactar el motor de auditoría." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
