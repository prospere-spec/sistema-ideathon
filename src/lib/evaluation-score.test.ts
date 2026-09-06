import { describe, expect, it } from "vitest";
import { calculateWeightedScore, normalizeEvaluationScore } from "./evaluation-score";

describe("evaluation score", () => {
  it("normalizes the five-point scale to zero through one hundred", () => {
    expect([1, 2, 3, 4, 5].map(normalizeEvaluationScore)).toEqual([0, 25, 50, 75, 100]);
  });

  it("calculates a weighted score", () => {
    expect(calculateWeightedScore([
      { criterionId: "innovation", score: 5, weight: 60 },
      { criterionId: "impact", score: 3, weight: 40 },
    ])).toBe(80);
  });

  it("supports a single criterion with all the weight", () => {
    expect(calculateWeightedScore([{ criterionId: "overall", score: 4, weight: 100 }])).toBe(75);
  });

  it("rejects invalid weight totals and scores", () => {
    expect(() => calculateWeightedScore([{ criterionId: "innovation", score: 4, weight: 90 }])).toThrow("exatamente 100");
    expect(() => calculateWeightedScore([{ criterionId: "innovation", score: 6, weight: 100 }])).toThrow("entre 1 e 5");
  });
});
