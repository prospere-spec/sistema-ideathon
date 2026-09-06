import { describe, expect, it } from "vitest";
import { parseIdeaInput } from "./idea-validation";

describe("parseIdeaInput", () => {
  it("normalizes a complete idea payload", () => {
    const result = parseIdeaInput({
      name: "  EcoTrack  ",
      problem: "Desperdício de energia",
      solution: "Monitoramento em tempo real",
      category: "Sustentabilidade",
      teamName: "  Green Team ",
      members: [{ name: "Ana Lima", role: "Produto", email: "ana@example.com" }],
    });

    expect(result).toEqual({
      data: {
        name: "EcoTrack",
        problem: "Desperdício de energia",
        solution: "Monitoramento em tempo real",
        audience: null,
        differentiation: null,
        category: "Sustentabilidade",
        pitchDeckUrl: null,
        videoPitchUrl: null,
        websiteUrl: null,
        teamName: "Green Team",
        members: [{ name: "Ana Lima", role: "Produto", email: "ana@example.com" }],
      },
    });
  });

  it("rejects missing required fields", () => {
    expect(parseIdeaInput({ name: "Idea", teamName: "Team" })).toEqual({
      error: "Nome da ideia, problema, solução e equipe são obrigatórios.",
    });
  });

  it("rejects an invalid member list", () => {
    expect(parseIdeaInput({ name: "Idea", problem: "Problem", solution: "Solution", teamName: "Team", members: [{ role: "Dev" }] })).toEqual({
      error: "Todo integrante precisa ter um nome.",
    });
  });
});
