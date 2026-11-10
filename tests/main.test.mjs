import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("Snake entry point", () => {
  it("explains a missing main element instead of silently rendering nothing", async () => {
    vi.stubGlobal("document", { querySelector: () => null });

    await expect(import("../src/main.ts")).rejects.toThrow(
      "The page is missing its #app main element.",
    );
  });
});
