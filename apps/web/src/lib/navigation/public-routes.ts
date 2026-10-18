/** Canonical URLs from Entrega 3C routes.json; approval does not mean implemented. */
export const publicRoutes = [
  { href: "/", label: "Inicio", stage: "PR03", implemented: true },
  { href: "/como-funciona", label: "Cómo funciona", stage: "PR04", implemented: false },
  { href: "/seguridad", label: "Seguridad", stage: "PR04", implemented: false },
  { href: "/precios", label: "Precios", stage: "PR04", implemented: false },
  { href: "/sign-in", label: "Entrar", stage: "PR06", implemented: false },
  { href: "/sign-up", label: "Probar gratis", stage: "PR06", implemented: false },
  { href: "/ayuda", label: "Ayuda", stage: "PR04", implemented: false },
  { href: "/legal/terminos", label: "Términos", stage: "PR04", implemented: false },
  { href: "/legal/privacidad", label: "Privacidad", stage: "PR04", implemented: false },
  { href: "/legal/cookies", label: "Cookies", stage: "PR04", implemented: false },
] as const;
export type PublicHref = (typeof publicRoutes)[number]["href"];
export const headerRoutes = publicRoutes.slice(1, 6);
export const footerRoutes = publicRoutes.slice(6);
// The approved mixed drawer also exposes Ayuda; private destinations are excluded.
export const drawerRoutes = [...publicRoutes.slice(1, 4), publicRoutes[6], ...publicRoutes.slice(4, 6)];
export function isCurrentPublicRoute(pathname: string, href: PublicHref) { return pathname === href; }
