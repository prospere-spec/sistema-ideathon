import { describe, expect, it } from "vitest";
import { buildRanking } from "./ranking";

describe("buildRanking", () => {
  it("aggregates scores and completion by idea", () => {
    const [row] = buildRanking([{
      ideaId: "idea-1",
      ideaName: "EcoTrack",
      teamName: "Green Team",
      category: "Impacto",
      expectedEvaluations: 2,
      evaluations: [
        { finalScore: "80.00", submittedAt: "2026-09-04T10:00:00.000Z", scores: [{ criterionId: "innovation", criterionName: "Inovação", score: 4 }] },
        { finalScore: 90, submittedAt: "2026-09-04T11:00:00.000Z", scores: [{ criterionId: "innovation", criterionName: "Inovação", score: 5 }] },
      ],
    }]);

    expect(row.finalScore).toBe(85);
    expect(row.receivedEvaluations).toBe(2);
    expect(row.completionPercent).toBe(100);
    expect(row.state).toBe("COMPLETE");
    expect(row.criterionAverages).toEqual([{ criterionId: "innovation", criterionName: "Inovação", average: 4.5 }]);
  });

  it("keeps equal scores tied and pending ideas without a rank", () => {
    const rows = buildRanking([
      { ideaId: "a", ideaName: "A", teamName: "A", category: null, expectedEvaluations: 1, evaluations: [{ finalScore: 75, submittedAt: "2026-09-04T10:00:00.000Z", scores: [] }] },
      { ideaId: "b", ideaName: "B", teamName: "B", category: null, expectedEvaluations: 1, evaluations: [{ finalScore: 75, submittedAt: "2026-09-04T10:00:00.000Z", scores: [] }] },
      { ideaId: "c", ideaName: "C", teamName: "C", category: null, expectedEvaluations: 1, evaluations: [] },
    ]);

    expect(rows.map((row) => row.rank)).toEqual([1, 1, null]);
    expect(rows[2].state).toBe("PENDING");
  });
});
