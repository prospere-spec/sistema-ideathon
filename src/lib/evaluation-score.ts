export type WeightedCriterion = {
  criterionId: string;
  score: number;
  weight: number;
};

export function normalizeEvaluationScore(score: number) {
  return (score - 1) * 25;
}

export function calculateWeightedScore(criteria: WeightedCriterion[]) {
  if (!criteria.length) throw new Error("A configuração precisa ter pelo menos um critério.");

  if (criteria.some((criterion) => !Number.isInteger(criterion.weight) || criterion.weight <= 0 || criterion.weight > 100)) {
    throw new Error("Os pesos devem ser inteiros positivos entre 1 e 100.");
  }

  const totalWeight = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (totalWeight !== 100) throw new Error("A soma dos pesos deve ser exatamente 100.");

  const scoreTotal = criteria.reduce((total, criterion) => {
    if (!Number.isInteger(criterion.score) || criterion.score < 1 || criterion.score > 5) {
      throw new Error("As notas devem ser inteiros entre 1 e 5.");
    }
    return total + normalizeEvaluationScore(criterion.score) * criterion.weight;
  }, 0);

  return Number((scoreTotal / 100).toFixed(2));
}
