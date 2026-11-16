import type { DiliCall, DiliCase } from "@/lib/dili/types";

const CALL_STYLE: Record<DiliCall, string> = {
  "no-injury": "bg-emerald-50 text-emerald-900 ring-emerald-200",
  equivocal: "bg-amber-50 text-amber-950 ring-amber-200",
  "dili-suspected": "bg-rose-50 text-rose-900 ring-rose-200",
  unevaluable: "bg-slate-100 text-slate-700 ring-slate-200",
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function DiliResult({
  record,
  imageUrl,
  onRemove,
  removing,
}: {
  record: DiliCase;
  imageUrl: string;
  onRemove: () => void;
  removing: boolean;
}) {
  const { prediction, specimen } = record;
  const score = prediction.injuryScore;
  const measures = [
    ["Section in frame", prediction.features.sectionFraction],
    ["Hematoxylin nuclei", prediction.features.nuclearFraction],
    ["Eosin cytoplasm", prediction.features.eosinFraction],
    ["Enclosed clear space", prediction.features.vacuoleFraction],
    ["Saturated red", prediction.features.saturatedRedFraction],
    ["Brown pigment", prediction.features.pigmentFraction],
  ] as const;

  return (
    <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prediction</p>
          <p
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${CALL_STYLE[prediction.call]}`}
          >
            {prediction.callLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove read"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Liver field ${specimen.filename}`}
          className="h-44 w-full rounded-lg border border-slate-200 object-cover"
        />
        <div className="space-y-2">
          <p className="text-sm text-slate-800">
            {specimen.filename}
            {specimen.animalId ? ` · ${specimen.animalId}` : ""}
            {specimen.studyId ? ` · ${specimen.studyId}` : ""}
          </p>
          <p className="text-sm text-slate-600">
            Overall grade{" "}
            <span className="font-medium text-slate-900">{prediction.overallSeverityLabel}</span>
            {score === null ? (
              <span> · injury score not computed</span>
            ) : (
              <span> · placeholder injury score {score.toFixed(2)}</span>
            )}
          </p>
          {score !== null && (
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <div className="h-full rounded-full bg-cyan-700" style={{ width: `${Math.round(score * 100)}%` }} />
            </div>
          )}
          <p className="text-sm leading-relaxed text-slate-700">{prediction.narrative}</p>
        </div>
      </div>

      {prediction.unevaluableReasons.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {prediction.unevaluableReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">What the reader measured</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {measures.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="text-sm font-medium text-slate-900">{pct(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-medium">Pattern</th>
              <th className="py-2 pr-3 font-medium">Grade</th>
              <th className="py-2 pr-3 font-medium">In injury score</th>
              <th className="py-2 font-medium">Reader note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prediction.findings.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-slate-500">
                  No graded pattern in this field.
                </td>
              </tr>
            ) : (
              prediction.findings.map((finding) => (
                <tr key={finding.code}>
                  <td className="py-2 pr-3 text-slate-900">{finding.label}</td>
                  <td className="py-2 pr-3 text-slate-700">
                    {finding.severity} · {finding.severityLabel}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">
                    {finding.contributesToInjury ? "Yes" : "No"}
                    <span className="text-slate-400"> · {Math.round(finding.confidence * 100)}%</span>
                  </td>
                  <td className="py-2 text-slate-600">{finding.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Model {prediction.modelId}. {prediction.disclaimer}
      </p>
    </article>
  );
}
