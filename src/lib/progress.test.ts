import { describe, expect, it } from "vitest";
import { clampProgress, formatProgress } from "./progress";

describe("progress helpers", () => {
  it("keeps values inside the visual progress range", () => {
    expect(clampProgress(-10)).toBe(0);
    expect(clampProgress(52.6)).toBe(53);
    expect(clampProgress(140)).toBe(100);
  });

  it("formats the clamped value for the UI", () => {
    expect(formatProgress(75)).toBe("75%");
  });
});
