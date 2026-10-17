// Do not inherit provider credentials, local .env values or arbitrary NODE_OPTIONS.
export function testEnvironment(extra = {}) {
  const allowed = /^(path|systemroot|windir|temp|tmp|home|userprofile|comspec|pathext|lang|lc_all|tz)$/i;
  return {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.test(key))),
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    ...extra,
  };
}
