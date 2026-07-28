export function pct(rate: number, digits = 1): string {
  if (!Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(digits)}%`;
}

export function rrLabel(rr: number): string {
  if (!Number.isFinite(rr)) return "—";
  if (rr === Infinity) return "∞";
  return `${rr.toFixed(2)}×`;
}
