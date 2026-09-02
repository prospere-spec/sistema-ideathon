import type { ReactNode } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  trend?: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "lime" | "indigo" | "neutral" | "danger";
  detail?: ReactNode;
};

const iconTones = {
  lime: "bg-lime/25 text-lime-deep",
  indigo: "bg-indigo/10 text-indigo-deep",
  neutral: "bg-surface-high text-ink",
  danger: "bg-danger-soft text-danger",
};

export function MetricCard({ label, value, trend, helper, icon: Icon, tone = "neutral", detail }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-black/[0.04] bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink-muted">{label}</h2>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", iconTones[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="text-[2.5rem] font-bold leading-none tracking-[-0.04em] text-ink">{value}</div>
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2 text-xs">
        {trend ? <span className="inline-flex items-center gap-0.5 rounded-md bg-lime/20 px-1.5 py-1 font-semibold text-lime-deep"><ArrowUpRight className="size-3.5" aria-hidden="true" />{trend}</span> : null}
        {detail || <span className="text-ink-muted/70">{helper}</span>}
      </div>
    </article>
  );
}
