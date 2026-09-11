export type PhaseDates = { startsAt?: Date | null; endsAt?: Date | null };

function parseDate(value: unknown, label: string) {
  if (value === null || value === "") return { data: null } as const;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return { error: `Informe uma data e hora de ${label} válidas.` } as const;
  return { data: date } as const;
}

export function parsePhaseDates(input: Record<string, unknown>) {
  const dates: PhaseDates = {};
  if (input.startsAt !== undefined) {
    const parsed = parseDate(input.startsAt, "início");
    if ("error" in parsed) return parsed;
    dates.startsAt = parsed.data;
  }
  if (input.endsAt !== undefined) {
    const parsed = parseDate(input.endsAt, "término");
    if ("error" in parsed) return parsed;
    dates.endsAt = parsed.data;
  }
  return { data: dates } as const;
}

export function hasValidPhaseDateRange(startsAt: Date | null, endsAt: Date | null) {
  return !startsAt || !endsAt || endsAt >= startsAt;
}
