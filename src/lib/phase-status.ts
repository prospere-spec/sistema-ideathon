export const phaseStatuses = ["DRAFT", "READY", "LIVE", "CLOSED"] as const;

export type PhaseStatus = (typeof phaseStatuses)[number];

export function isPhaseStatus(value: string): value is PhaseStatus {
  return phaseStatuses.includes(value as PhaseStatus);
}

export function canTransitionPhaseStatus(current: PhaseStatus, next: PhaseStatus) {
  if (current === next) return true;
  return (
    (current === "DRAFT" && next === "READY") ||
    (current === "READY" && next === "LIVE") ||
    (current === "LIVE" && (next === "READY" || next === "DRAFT" || next === "CLOSED")) ||
    (current === "CLOSED" && next === "READY")
  );
}
