"use client";

import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onClose, tone = "success" }: { message: string; onClose?: () => void; tone?: "success" | "error" }) {
  const isError = tone === "error";
  return (
    <div role="status" className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold shadow-popover ${isError ? "bg-danger text-white" : "bg-primary text-white"}`}>
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onClose ? <button type="button" onClick={onClose} className="rounded p-0.5 hover:bg-white/15" aria-label="Fechar aviso"><X className="size-4" /></button> : null}
    </div>
  );
}
