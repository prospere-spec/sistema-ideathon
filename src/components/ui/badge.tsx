import { cn } from "@/lib/utils";

type BadgeTone = "lime" | "indigo" | "neutral" | "danger" | "amber";

const tones: Record<BadgeTone, string> = {
  lime: "bg-lime/25 text-lime-deep",
  indigo: "bg-indigo/10 text-indigo-deep",
  neutral: "bg-surface-high text-ink-muted",
  danger: "bg-danger-soft text-danger",
  amber: "bg-amber-100 text-amber-800",
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
