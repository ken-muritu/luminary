import { describe, expect, it } from "vitest";

// Turso WASM requires OPFS + browser context — covered by Playwright e2e.
describe.skip("songs queries (browser only)", () => {
  it("placeholder", () => {
    expect(true).toBe(true);
  });
});
