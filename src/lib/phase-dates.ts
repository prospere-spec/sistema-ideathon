export type PhaseDates = { startsAt?: Date | null; endsAt?: Date | null };
type DateParseResult = { ok: true; value: Date | null } | { ok: false; error: string };
type PhaseDatesResult = { ok: true; data: PhaseDates } | { ok: false; error: string };

function parseDate(value: unknown, label: string): DateParseResult {
  if (value === null || value === "") return { ok: true, value: null };
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return { ok: false, error: `Informe uma data e hora de ${label} válidas.` };
  return { ok: true, value: date };
}

export function parsePhaseDates(input: Record<string, unknown>): PhaseDatesResult {
  const dates: PhaseDates = {};
  if (input.startsAt !== undefined) {
    const parsed = parseDate(input.startsAt, "início");
    if (!parsed.ok) return parsed;
    dates.startsAt = parsed.value;
  }
  if (input.endsAt !== undefined) {
    const parsed = parseDate(input.endsAt, "término");
    if (!parsed.ok) return parsed;
    dates.endsAt = parsed.value;
  }
  return { ok: true, data: dates };
}

export function hasValidPhaseDateRange(startsAt: Date | null, endsAt: Date | null) {
  return !startsAt || !endsAt || endsAt >= startsAt;
}
