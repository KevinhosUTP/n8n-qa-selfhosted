import Link from "next/link";
import { RouteFocus } from "@/components/public/RouteFocus";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="technical technical-copy">
      <h1>404 · Página no encontrada</h1>
      <p>La dirección solicitada no está disponible.</p>
      <Link href="/">Volver al inicio</Link>
      <RouteFocus focusOnMount />
    </main>
  );
}
