import type { AutomatedReviewStatus } from "@/lib/types";

const styles: Record<AutomatedReviewStatus, string> = {
  pass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  flagged: "bg-amber-50 text-amber-800 ring-amber-200",
  critical: "bg-rose-50 text-rose-800 ring-rose-200",
};

const labels: Record<AutomatedReviewStatus, string> = {
  pass: "Within tolerance",
  flagged: "Elevated relative risk",
  critical: "Absolute QTL breach",
};

export function StatusBadge({ status }: { status: AutomatedReviewStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function RelativeRiskBadge({
  status,
  rr,
}: {
  status: "within_expected" | "elevated";
  rr: number;
}) {
  const elevated = status === "elevated";
  return (
    <span
      className={`font-mono text-xs ${elevated ? "text-amber-700" : "text-slate-600"}`}
      title={elevated ? "Relative risk ≥ 1.25× expected" : "Relative risk within expected band"}
    >
      {Number.isFinite(rr) ? `${rr.toFixed(2)}×` : "—"}
    </span>
  );
}
