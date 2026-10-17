import { readPublicConfig } from "./validation";

// Static explicit lookup is intentional: Next inlines public values at build time.
export const publicConfig = readPublicConfig({
  NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN,
});
