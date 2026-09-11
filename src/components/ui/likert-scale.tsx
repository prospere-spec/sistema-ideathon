type LikertOption = {
  value: number;
  label: string;
};

const defaultOptions: LikertOption[] = [
  { value: 1, label: "Insatisfatório" },
  { value: 2, label: "Abaixo do esperado" },
  { value: 3, label: "Adequado" },
  { value: 4, label: "Muito bom" },
  { value: 5, label: "Excelente" },
];

export function LikertScale({ name, value, disabled, onChange, options = defaultOptions }: { name: string; value?: number; disabled?: boolean; onChange: (value: number) => void; options?: LikertOption[] }) {
  return (
    <div className="rounded-md bg-surface-low px-5 py-3 sm:px-7">
      <div className="relative">
        <div className="absolute left-5 right-5 top-5 h-0.5 bg-outline/40 sm:left-8 sm:right-8" aria-hidden="true" />
        <div className="relative grid grid-cols-5 gap-1">
          {options.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                name={name}
                disabled={disabled}
                aria-label={`Nota ${option.value}: ${option.label}`}
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={`mx-auto flex size-10 items-center justify-center rounded-full border-2 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 disabled:cursor-not-allowed ${selected ? "border-primary bg-primary text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]" : "border-outline bg-white text-ink hover:-translate-y-0.5 hover:border-ink"}`}
              >
                {option.value}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1" aria-hidden="true">
        {options.map((option) => <span key={option.value} className="text-center text-[10px] font-medium leading-3 text-ink-muted sm:text-xs">{option.label}</span>)}
      </div>
    </div>
  );
}
