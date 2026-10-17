import { expect, it } from "vitest";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { assertNoDesignPreview } from "../scripts/check-design-build.mjs";

it("refuses a production build containing the temporary browser route", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "kevolint-build-"));
  try {
    await expect(assertNoDesignPreview(root)).resolves.toBeUndefined();
    await mkdir(resolve(root, "src/app/pr02-design-preview"), { recursive: true });
    await expect(assertNoDesignPreview(root)).rejects.toThrow(/Temporary PR02 preview/);
  } finally {
    expect(dirname(resolve(root))).toBe(resolve(tmpdir()));
    await rm(root, { recursive: true, force: true });
  }
});
