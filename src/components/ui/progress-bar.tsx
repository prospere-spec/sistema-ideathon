import { clampProgress, formatProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ProgressBar({ value, showLabel = true, className }: { value: number; showLabel?: boolean; className?: string }) {
  const progress = clampProgress(value);
  return (
    <div className={cn("w-full", className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`Progresso: ${formatProgress(progress)}`}
      >
        <div className="h-full rounded-full bg-indigo transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      {showLabel ? <div className="mt-1 text-right text-[11px] font-medium text-ink-muted">{formatProgress(progress)}</div> : null}
    </div>
  );
}
