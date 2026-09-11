export const ideathonStatuses = ["DRAFT", "READY", "LIVE", "CLOSED"] as const;
export type IdeathonStatus = (typeof ideathonStatuses)[number];

export function isIdeathonStatus(value: unknown): value is IdeathonStatus {
  return typeof value === "string" && ideathonStatuses.includes(value as IdeathonStatus);
}

export type IdeathonStatusContext = { hasPreparedPhase: boolean; hasLivePhase: boolean; hasLiveRoom: boolean };

export function ideathonStatusError(current: IdeathonStatus, next: IdeathonStatus, context: IdeathonStatusContext): string | null {
  if (current === next) return null;
  if (current === "CLOSED") return "O ideathon está encerrado e não pode mudar de status.";
  if (next === "DRAFT" && current !== "READY") return "Somente um ideathon pronto pode voltar para rascunho.";
  if (next === "READY" && current !== "DRAFT") return "Somente um ideathon em rascunho pode ser marcado como pronto.";
  if ((next === "DRAFT" || next === "READY") && (context.hasLivePhase || context.hasLiveRoom)) return "O evento já possui uma fase ou sala ao vivo. Sincronize o status para Ao vivo.";
  if (next === "READY" && !context.hasPreparedPhase) return "Prepare ao menos uma fase: marque-a como pronta, publique os critérios e deixe uma sala pronta com uma ideia ativa e um avaliador ativo.";
  if (next === "LIVE" && !context.hasLivePhase) return "Inicie uma fase para colocar o ideathon ao vivo.";
  if (next === "CLOSED" && (context.hasLivePhase || context.hasLiveRoom)) return "Encerre as fases e salas ao vivo antes de encerrar o ideathon.";
  return null;
}

export function ideathonStatusAction(status: IdeathonStatus) {
  return status === "READY" ? "IDEATHON_READY" : status === "LIVE" ? "IDEATHON_STARTED" : status === "CLOSED" ? "IDEATHON_CLOSED" : "IDEATHON_UPDATED";
}
