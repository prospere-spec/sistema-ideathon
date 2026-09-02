"use client";

import { cn } from "@/lib/utils";

export type LikertOption = { value: number; label: string; description: string };

export function LikertScale({ name, value, options, onChange, disabled = false }: { name: string; value?: number; options: LikertOption[]; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <fieldset disabled={disabled} className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
      <legend className="sr-only">Selecione uma nota</legend>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label key={option.value} className={cn("group relative flex cursor-pointer items-center gap-3 rounded-md border border-outline/50 bg-white p-3 transition-all sm:block sm:p-4 sm:text-center", selected ? "border-primary bg-primary text-white shadow-sm" : "hover:-translate-y-0.5 hover:border-lime hover:shadow-card", disabled && "cursor-not-allowed opacity-60")}>
            <input type="radio" name={name} value={option.value} checked={selected} onChange={() => onChange(option.value)} className="sr-only" />
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold sm:mx-auto sm:mb-3", selected ? "border-lime bg-lime text-lime-foreground" : "border-outline/60 text-ink", "group-focus-within:ring-2 group-focus-within:ring-lime")}>{option.value}</span>
            <span className="block"><span className={cn("block text-sm font-bold", !selected && "text-ink")}>{option.label}</span><span className={cn("mt-0.5 block text-xs leading-4", selected ? "text-white/75" : "text-ink-muted")}>{option.description}</span></span>
          </label>
        );
      })}
    </fieldset>
  );
}
