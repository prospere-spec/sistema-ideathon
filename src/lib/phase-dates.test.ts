import { describe, expect, it } from "vitest";
import { hasValidPhaseDateRange, parsePhaseDates } from "./phase-dates";

describe("phase dates", () => {
  it("accepts valid ISO date times and preserves empty values", () => {
    expect(parsePhaseDates({ startsAt: "2026-09-11T09:00:00.000Z", endsAt: "" })).toMatchObject({ data: { startsAt: new Date("2026-09-11T09:00:00.000Z"), endsAt: null } });
  });

  it("rejects invalid dates and inverted date ranges", () => {
    expect(parsePhaseDates({ startsAt: "not-a-date" })).toMatchObject({ error: expect.any(String) });
    expect(hasValidPhaseDateRange(new Date("2026-09-11T10:00:00.000Z"), new Date("2026-09-11T09:00:00.000Z"))).toBe(false);
  });
});
