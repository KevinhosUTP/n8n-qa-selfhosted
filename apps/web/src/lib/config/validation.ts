type Environment = Readonly<Record<string, string | undefined>>;

const publicKeys = new Set(["NEXT_PUBLIC_APP_ORIGIN"]);
const approvedHosts = new Set(["qa.kevosilva.dev", "dev.qa.kevosilva.dev"]);
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type PublicConfig = Readonly<{ appOrigin?: string }>;

export function readPublicConfig(environment: Environment): PublicConfig {
  // Default deny: future publishable SDK keys require an explicit reviewed addition.
  if (Object.keys(environment).some((key) =>
    key.startsWith("NEXT_PUBLIC_") && !publicKeys.has(key) && environment[key] !== undefined
  )) {
    throw new Error("Invalid public environment configuration.");
  }

  const origin = environment.NEXT_PUBLIC_APP_ORIGIN;
  if (origin === undefined || origin === "") return Object.freeze({});

  try {
    const url = new URL(origin);
    const local = loopbackHosts.has(url.hostname);
    if (
      url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (local ? !["http:", "https:"].includes(url.protocol) :
        url.protocol !== "https:" || !approvedHosts.has(url.hostname) || url.port !== "")
    ) throw new Error();
    return Object.freeze({ appOrigin: url.origin });
  } catch {
    // Do not interpolate the input, URL, or even arbitrary environment key names.
    throw new Error("Invalid public environment configuration.");
  }
}

export function readRuntime(environment: Environment): "development" | "test" | "production" {
  const runtime = environment.NODE_ENV ?? "development";
  if (runtime !== "development" && runtime !== "test" && runtime !== "production") {
    throw new Error("Invalid server environment configuration.");
  }
  return runtime;
}
