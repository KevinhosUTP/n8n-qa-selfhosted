import "server-only";
import { readPublicConfig, readRuntime } from "./validation";

export function getServerConfig() {
  readPublicConfig(process.env);
  return Object.freeze({ runtime: readRuntime(process.env) });
}
