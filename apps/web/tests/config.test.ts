import { describe, expect, it } from "vitest";
import { readPublicConfig, readRuntime } from "../src/lib/config/validation";

describe("public configuration", () => {
  it("boots without external configuration", () => {
    expect(readPublicConfig({})).toEqual({});
    expect(readPublicConfig({ NEXT_PUBLIC_APP_ORIGIN: "" })).toEqual({});
  });

  it.each([
    "http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000",
    "https://dev.qa.kevosilva.dev", "https://qa.kevosilva.dev/",
  ])("accepts an approved origin: %s", (origin) => {
    expect(readPublicConfig({ NEXT_PUBLIC_APP_ORIGIN: origin }).appOrigin).toBe(new URL(origin).origin);
  });

  it.each([
    "invalid", "http://qa.kevosilva.dev", "https://example.invalid",
    "https://qa.kevosilva.dev.evil.invalid", "https://qa.kevosilva.dev:444",
    "https://qa.kevosilva.dev/private", "https://user:synthetic@qa.kevosilva.dev",
    "https://qa.kevosilva.dev/?token=synthetic", "https://qa.kevosilva.dev/#synthetic",
    "javascript:alert(1)", "file:///etc/passwd",
  ])("rejects unsafe origins without echoing input: %s", (origin) => {
    expect(() => readPublicConfig({ NEXT_PUBLIC_APP_ORIGIN: origin }))
      .toThrow(/^Invalid public environment configuration\.$/);
  });

  it.each(["NEXT_PUBLIC_SECRET", "NEXT_PUBLIC_API_KEY", "NEXT_PUBLIC_UNKNOWN", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"])(
    "rejects public keys outside the reviewed allowlist: %s", (key) => {
      expect(() => readPublicConfig({ [key]: "synthetic" }))
        .toThrow(/^Invalid public environment configuration\.$/);
      expect(() => readPublicConfig({ [key]: "" })).toThrow();
    },
  );

  it("never copies private values into the public object", () => {
    const config = readPublicConfig({ PRIVATE_VALUE: "synthetic-server-only-value" });
    expect(JSON.stringify(config)).not.toContain("synthetic-server-only-value");
    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe("server runtime configuration", () => {
  it.each(["development", "test", "production"])("accepts %s", (runtime) => {
    expect(readRuntime({ NODE_ENV: runtime })).toBe(runtime);
  });
  it("supports a missing value and rejects invalid input without disclosure", () => {
    expect(readRuntime({})).toBe("development");
    expect(() => readRuntime({ NODE_ENV: "synthetic-private-value" }))
      .toThrow(/^Invalid server environment configuration\.$/);
  });
});
