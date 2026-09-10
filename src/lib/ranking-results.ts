import { buildRanking, type RankingCandidate } from "./ranking";

export type RoomRankingCandidate = RankingCandidate & { roomId: string | null; roomName: string | null };
export type RankingResultRow = ReturnType<typeof buildRanking>[number] & { roomId: string | null; roomName: string | null };

export function summarizeRanking(rows: RankingResultRow[]) {
  const received = rows.reduce((total, row) => total + row.receivedEvaluations, 0);
  const expected = rows.reduce((total, row) => total + row.expectedEvaluations, 0);
  const scores = rows.flatMap((row) => row.finalScore === null ? [] : [row.finalScore]);
  const timestamps = rows.flatMap((row) => row.lastUpdatedAt ? [row.lastUpdatedAt] : []);
  return {
    totalIdeas: rows.length,
    expectedEvaluations: expected,
    receivedEvaluations: received,
    completionPercent: expected ? Math.min(100, Math.round((received / expected) * 100)) : 0,
    averageScore: scores.length ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(2)) : null,
    updatedAt: timestamps.length ? timestamps.sort().at(-1)! : null,
  };
}

export type RankingSummary = ReturnType<typeof summarizeRanking>;
export type RoomRanking = { roomId: string | null; roomName: string; data: RankingResultRow[]; summary: RankingSummary };

// Call with candidates and rooms from one phase only. Each room gets its own
// ranking calculation; filtering the global ranks would leave gaps and wrong ties.
export function buildRankingResults(candidates: RoomRankingCandidate[], rooms: Array<{ id: string; name: string }>) {
  const candidateById = new Map(candidates.map((candidate) => [candidate.ideaId, candidate]));
  const withRoom = (row: ReturnType<typeof buildRanking>[number]): RankingResultRow => {
    const candidate = candidateById.get(row.ideaId)!;
    return { ...row, roomId: candidate.roomId, roomName: candidate.roomName };
  };
  const data = buildRanking(candidates).map(withRoom);
  const roomRankings: RoomRanking[] = rooms.map((room) => {
    const roomData = buildRanking(candidates.filter((candidate) => candidate.roomId === room.id)).map(withRoom);
    return { roomId: room.id, roomName: room.name, data: roomData, summary: summarizeRanking(roomData) };
  });
  const unassigned = data.filter((row) => row.roomId === null).map((row) => ({ ...row, rank: null }));
  if (unassigned.length) roomRankings.push({ roomId: null, roomName: "Sem sala", data: unassigned, summary: summarizeRanking(unassigned) });
  return { data, summary: summarizeRanking(data), roomRankings };
}
