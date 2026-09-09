import { describe, expect, it } from "vitest";
import { canTransitionPhaseStatus } from "./phase-status";

describe("transições de status da fase", () => {
  it("permite as transições operacionais válidas", () => {
    expect(canTransitionPhaseStatus("DRAFT", "READY")).toBe(true);
    expect(canTransitionPhaseStatus("READY", "LIVE")).toBe(true);
    expect(canTransitionPhaseStatus("LIVE", "READY")).toBe(true);
    expect(canTransitionPhaseStatus("LIVE", "CLOSED")).toBe(true);
    expect(canTransitionPhaseStatus("CLOSED", "READY")).toBe(true);
    expect(canTransitionPhaseStatus("READY", "READY")).toBe(true);
  });

  it("rejeita transições que pulam ou reabrem no estado errado", () => {
    expect(canTransitionPhaseStatus("DRAFT", "LIVE")).toBe(false);
    expect(canTransitionPhaseStatus("READY", "CLOSED")).toBe(false);
    expect(canTransitionPhaseStatus("CLOSED", "LIVE")).toBe(false);
    expect(canTransitionPhaseStatus("CLOSED", "DRAFT")).toBe(false);
  });
});
