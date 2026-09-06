export type RankingEvaluation = {
  finalScore: number | string | null;
  submittedAt: Date | string | null;
  scores: Array<{ criterionId: string; criterionName: string; score: number }>;
};

export type RankingCandidate = {
  ideaId: string;
  ideaName: string;
  teamName: string;
  category: string | null;
  expectedEvaluations: number;
  evaluations: RankingEvaluation[];
};

function round(value: number) {
  return Number(value.toFixed(2));
}

export function buildRanking(candidates: RankingCandidate[]) {
  const rows = candidates.map((candidate) => {
    const receivedEvaluations = candidate.evaluations.filter((evaluation) => evaluation.finalScore !== null);
    const finalScore = receivedEvaluations.length
      ? round(receivedEvaluations.reduce((total, evaluation) => total + Number(evaluation.finalScore), 0) / receivedEvaluations.length)
      : null;
    const criteria = new Map<string, { name: string; total: number; count: number }>();
    for (const evaluation of receivedEvaluations) {
      for (const score of evaluation.scores) {
        const current = criteria.get(score.criterionId) || { name: score.criterionName, total: 0, count: 0 };
        current.total += score.score;
        current.count += 1;
        criteria.set(score.criterionId, current);
      }
    }
    const expectedEvaluations = candidate.expectedEvaluations;
    const receivedEvaluationsCount = receivedEvaluations.length;
    const state = !expectedEvaluations || !receivedEvaluationsCount
      ? "PENDING"
      : receivedEvaluationsCount >= expectedEvaluations ? "COMPLETE" : "PARTIAL";
    const timestamps = receivedEvaluations.map((evaluation) => evaluation.submittedAt ? new Date(evaluation.submittedAt).getTime() : 0);
    const lastUpdatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

    return {
      ideaId: candidate.ideaId,
      ideaName: candidate.ideaName,
      teamName: candidate.teamName,
      category: candidate.category,
      finalScore,
      expectedEvaluations,
      receivedEvaluations: receivedEvaluationsCount,
      completionPercent: expectedEvaluations ? Math.min(100, Math.round((receivedEvaluationsCount / expectedEvaluations) * 100)) : 0,
      state,
      rank: null as number | null,
      criterionAverages: Array.from(criteria, ([criterionId, value]) => ({ criterionId, criterionName: value.name, average: round(value.total / value.count) })),
      lastUpdatedAt,
    };
  });

  const ranked = rows.filter((row) => row.finalScore !== null).sort((left, right) => (right.finalScore as number) - (left.finalScore as number));
  let previousScore: number | null = null;
  let previousRank = 0;
  ranked.forEach((row, index) => {
    const rank = row.finalScore === previousScore ? previousRank : index + 1;
    row.rank = rank;
    previousScore = row.finalScore;
    previousRank = rank;
  });

  return rows.sort((left, right) => {
    if (left.rank === null) return 1;
    if (right.rank === null) return -1;
    return left.rank - right.rank;
  });
}
