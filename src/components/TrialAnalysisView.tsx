"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RelativeRiskBadge, StatusBadge } from "./StatusBadge";
import { pct } from "@/lib/format";
import type { TrialAnalysis } from "@/lib/types";

export function TrialAnalysisView({ analysis }: { analysis: TrialAnalysis }) {
  const chartData = analysis.kriResults
    .filter((r) => r.kriId === "sae_rate")
    .map((r) => ({
      site: r.siteName.split("—")[0]?.trim() ?? r.siteId,
      observed: Number((r.observedRate * 100).toFixed(2)),
      expected: Number((r.expectedRate * 100).toFixed(2)),
    }));

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Automated review summary</h3>
            <p className="text-xs text-slate-500">
              Last run {new Date(analysis.reviewedAt).toLocaleString()} · no human sign-off required
            </p>
          </div>
          <StatusBadge status={analysis.summary.overallStatus} />
        </div>
        <p className="mt-3 text-sm text-slate-700">
          {analysis.summary.qtlBreaches > 0
            ? `${analysis.summary.qtlBreaches} study-level QTL absolute breach(es) detected.`
            : "No study-level absolute QTL breaches."}{" "}
          {analysis.summary.kriElevated > 0
            ? `${analysis.summary.kriElevated} site KRI(s) show elevated relative risk (≥1.25× expected).`
            : "All site KRIs within expected relative risk band."}
        </p>
      </section>

      {chartData.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">SAE rate by site (%)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="site" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}
                />
                <Legend />
                <Bar dataKey="observed" name="Observed" fill="#0891b2" />
                <Bar dataKey="expected" name="Expected benchmark" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Key risk indicators (site-level)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Relative risk = observed rate ÷ expected rate. Safety and clinical operations KRIs are
          evaluated per investigational site.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">KRI</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Observed</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Relative risk</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analysis.kriResults.map((r) => (
                <tr key={`${r.siteId}-${r.kriId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800">{r.siteName}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.kriName}</td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">
                    {r.category.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{pct(r.observedRate)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{pct(r.expectedRate)}</td>
                  <td className="px-4 py-2.5">
                    <RelativeRiskBadge status={r.relativeRiskStatus} rr={r.relativeRisk} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.automatedReviewStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Quality tolerance limits (study-level)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Absolute risk flags when the study-wide observed rate crosses the QTL limit. Relative risk
          compares the study aggregate to the expected benchmark.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">QTL</th>
                <th className="px-4 py-3">Observed</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Absolute limit</th>
                <th className="px-4 py-3">Relative risk</th>
                <th className="px-4 py-3">Absolute breach</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analysis.qtlResults.map((q) => (
                <tr key={q.qtlId} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800">{q.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{pct(q.observedRate)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{pct(q.expectedRate)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-rose-700">
                    {pct(q.absoluteLimit)}
                  </td>
                  <td className="px-4 py-2.5">
                    <RelativeRiskBadge status={q.relativeRiskStatus} rr={q.relativeRisk} />
                  </td>
                  <td className="px-4 py-2.5">
                    {q.absoluteBreach ? (
                      <span className="text-xs font-medium text-rose-700">Yes</span>
                    ) : (
                      <span className="text-xs text-slate-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={q.automatedReviewStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
