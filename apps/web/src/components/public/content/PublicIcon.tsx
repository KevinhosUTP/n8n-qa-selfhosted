export const publicIconNames = ["shield", "check", "workflow", "upload", "file", "settings", "search", "lock", "clock", "data-flow", "agent", "alert"] as const;
export type PublicIconName = (typeof publicIconNames)[number];
/** Original Figma vector exports; decorative beside visible text. */
// eslint-disable-next-line @next/next/no-img-element -- Exact original vector resource, no transformation.
export function PublicIcon({ name }: { name: PublicIconName }) { return <img src={`/public-content/${name}.svg`} width={24} height={24} alt="" loading="lazy" />; }
