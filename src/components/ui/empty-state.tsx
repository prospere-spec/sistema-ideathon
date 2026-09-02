import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-surface-high text-ink-muted"><Inbox className="size-5" aria-hidden="true" /></span>
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
