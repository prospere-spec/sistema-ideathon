import { describe, expect, it } from "vitest";
import { buildRankingResults, type RoomRankingCandidate } from "./ranking-results";

const rooms = [{ id: "north", name: "Sala Norte" }, { id: "south", name: "Sala Sul" }];
function candidate(ideaId: string, roomId: string | null, scores: number[], expectedEvaluations = 1): RoomRankingCandidate {
  return {
    ideaId, ideaName: ideaId, teamName: `Equipe ${ideaId}`, category: null,
    roomId, roomName: rooms.find((room) => room.id === roomId)?.name || null,
    expectedEvaluations,
    evaluations: scores.map((finalScore) => ({ finalScore, submittedAt: "2026-09-10T12:00:00.000Z", scores: [] })),
  };
}

describe("rankings independentes por sala", () => {
  it("mantém a classificação geral e reinicia as posições de cada sala, inclusive empates", () => {
    const result = buildRankingResults([
      candidate("a", "north", [95]), candidate("b", "south", [90]),
      candidate("c", "south", [90]), candidate("d", "north", [85]),
      candidate("e", "south", [75]),
    ], rooms);

    expect(result.data.map((row) => [row.ideaId, row.rank])).toEqual([["a", 1], ["b", 2], ["c", 2], ["d", 4], ["e", 5]]);
    expect(result.roomRankings[0].data.map((row) => [row.ideaId, row.rank])).toEqual([["a", 1], ["d", 2]]);
    expect(result.roomRankings[1].data.map((row) => [row.ideaId, row.rank])).toEqual([["b", 1], ["c", 1], ["e", 3]]);
    // Local recalculation must not mutate the general ranking.
    expect(result.data.find((row) => row.ideaId === "d")?.rank).toBe(4);
    expect(result.summary.totalIdeas).toBe(5);
  });

  it("calcula médias e progresso locais sem confundir avaliações parciais com pendentes", () => {
    const result = buildRankingResults([
      candidate("a", "north", [80, 100], 2),
      candidate("b", "north", [60], 2),
      candidate("c", "north", [], 2),
      candidate("d", "south", [100]),
    ], rooms);

    expect(result.roomRankings[0].summary).toMatchObject({ totalIdeas: 3, receivedEvaluations: 3, expectedEvaluations: 6, completionPercent: 50, averageScore: 75 });
    expect(result.roomRankings[0].data.map((row) => [row.state, row.rank])).toEqual([["COMPLETE", 1], ["PARTIAL", 2], ["PENDING", null]]);
    expect(result.roomRankings[1].summary).toMatchObject({ totalIdeas: 1, completionPercent: 100, averageScore: 100 });
    expect(result.summary).toMatchObject({ totalIdeas: 4, receivedEvaluations: 4, expectedEvaluations: 7, completionPercent: 57, averageScore: 83.33 });
  });

  it("inclui salas vazias e preserva ideias sem sala no geral e em um grupo identificado", () => {
    const result = buildRankingResults([candidate("unassigned", null, [], 0)], rooms);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ ideaId: "unassigned", roomId: null, rank: null });
    expect(result.roomRankings.slice(0, 2).map((room) => room.data.length)).toEqual([0, 0]);
    expect(result.roomRankings[0].summary).toMatchObject({ averageScore: null, updatedAt: null, completionPercent: 0 });
    expect(result.roomRankings[2]).toMatchObject({ roomId: null, roomName: "Sem sala" });
    expect(result.roomRankings[2].data[0].ideaId).toBe("unassigned");
  });
});
