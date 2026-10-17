import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>404 · Página no encontrada</h1>
      <p>La dirección solicitada no está disponible.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
