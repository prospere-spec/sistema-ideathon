import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { RankingResultRow, RankingSummary } from "@/lib/ranking-results";

export const rankingStateLabels: Record<string, string> = { PENDING: "Pendente", PARTIAL: "Em progresso", COMPLETE: "Completa" };

export function RankingTable({ title, description, rows, summary, showRoom = false }: {
  title: string;
  description: string;
  rows: RankingResultRow[];
  summary: RankingSummary;
  showRoom?: boolean;
}) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card">
      <header className="flex flex-col justify-between gap-4 border-b border-outline/30 px-5 py-6 sm:px-7 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.04em] text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="lime"><CheckCircle2 className="mr-1 size-3.5" />{rows.filter((row) => row.state === "COMPLETE").length} completas</Badge>
          <Badge tone="amber"><Clock3 className="mr-1 size-3.5" />{rows.filter((row) => row.state === "PARTIAL").length} parciais</Badge>
        </div>
      </header>
      {!showRoom ? <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-outline/30 bg-surface-low/60 px-5 py-3 text-sm text-ink-muted sm:px-7">
        <span><strong className="tabular-nums text-ink">{summary.totalIdeas}</strong> ideias</span>
        <span>Média: <strong className="tabular-nums text-ink">{summary.averageScore?.toFixed(2) ?? "--"}</strong></span>
        <span>Avaliações: <strong className="tabular-nums text-ink">{summary.receivedEvaluations} / {summary.expectedEvaluations}</strong></span>
        <span className="font-semibold text-lime-deep">{summary.completionPercent}% concluído</span>
      </div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <caption className="sr-only">{title} — {description}</caption>
          <thead><tr className="bg-surface-low/60">
            <th scope="col" className="px-5 py-4 text-xs font-semibold text-ink-muted sm:px-7">Posição</th>
            <th scope="col" className="px-5 py-4 text-xs font-semibold text-ink-muted">Ideia</th>
            <th scope="col" className="px-5 py-4 text-xs font-semibold text-ink-muted">Equipe</th>
            {showRoom ? <th scope="col" className="px-5 py-4 text-xs font-semibold text-ink-muted">Sala</th> : null}
            <th scope="col" className="px-5 py-4 text-xs font-semibold text-ink-muted">Status</th>
            <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Avaliações</th>
            <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-ink-muted">Conclusão</th>
            <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-ink-muted sm:px-7">Nota final</th>
          </tr></thead>
          <tbody className="divide-y divide-outline/30">
            {rows.map((row) => <tr key={row.ideaId} className="transition-colors hover:bg-surface-low/50">
              <td className="px-5 py-4 font-bold tabular-nums text-ink sm:px-7">{row.rank === null ? "--" : `${row.rank}º`}</td>
              <td className="px-5 py-4">
                <p className="font-bold text-ink">{row.ideaName}</p>
                <p className="mt-1 text-xs text-ink-muted">{row.category || "Sem categoria"}</p>
                {row.criterionAverages.length ? <details className="mt-2 text-xs text-ink-muted">
                  <summary className="cursor-pointer font-semibold text-lime-deep">Médias por critério</summary>
                  <ul className="mt-2 space-y-1">{row.criterionAverages.map((criterion) => <li key={criterion.criterionId}>{criterion.criterionName}: {criterion.average.toFixed(2)}</li>)}</ul>
                </details> : null}
              </td>
              <td className="px-5 py-4 text-sm text-ink-muted">{row.teamName}</td>
              {showRoom ? <td className="px-5 py-4 text-sm text-ink-muted">{row.roomName || "Sem sala"}</td> : null}
              <td className="px-5 py-4"><Badge tone={row.state === "COMPLETE" ? "lime" : row.state === "PARTIAL" ? "amber" : "neutral"}>{rankingStateLabels[row.state]}</Badge></td>
              <td className="px-5 py-4 text-right text-sm tabular-nums text-ink-muted">{row.receivedEvaluations} / {row.expectedEvaluations}</td>
              <td className="min-w-36 px-5 py-4"><ProgressBar value={row.completionPercent} /></td>
              <td className="px-5 py-4 text-right text-lg font-bold tabular-nums text-ink sm:px-7">{row.finalScore?.toFixed(2) ?? "--"}</td>
            </tr>)}
            {!rows.length ? <tr><td colSpan={showRoom ? 8 : 7} className="px-6 py-12 text-center text-sm text-ink-muted">{summary.totalIdeas ? "Nenhuma ideia corresponde aos filtros." : "Nenhuma ideia para classificar neste recorte."}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-outline/30 px-5 py-3 text-xs text-ink-muted sm:px-7">Exibindo {rows.length} de {summary.totalIdeas} ideias. Somente avaliações enviadas participam da nota final.</footer>
    </section>
  );
}
