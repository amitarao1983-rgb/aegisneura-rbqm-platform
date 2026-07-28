"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { pct, rrLabel } from "@/lib/format";
import { OVERSIGHT_ROLES } from "@/lib/roles";
import type { AiFindingRow } from "@/lib/oversight";
import type {
  AiRiskFactor,
  OversightRole,
  RiskSignal,
  RiskSignalPriority,
  Trial,
} from "@/lib/types";

type Props = {
  trials: Trial[];
  findings: AiFindingRow[];
  riskSignals: RiskSignal[];
  initialTrialId?: string;
};

export function OversightWorkbench({
  trials,
  findings,
  riskSignals,
  initialTrialId,
}: Props) {
  const router = useRouter();
  const [trialId, setTrialId] = useState(initialTrialId ?? "");
  const [role, setRole] = useState<OversightRole>("clinical_ops_lead");
  const [raisedByName, setRaisedByName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [queryText, setQueryText] = useState("");
  const [priority, setPriority] = useState<RiskSignalPriority>("routine");
  const [selectedFactors, setSelectedFactors] = useState<AiRiskFactor[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const trial = trials.find((t) => t.id === trialId);
  const filteredFindings = useMemo(
    () => (trialId ? findings.filter((f) => f.trialId === trialId) : findings),
    [findings, trialId]
  );
  const filteredSignals = useMemo(
    () => (trialId ? riskSignals.filter((s) => s.trialId === trialId) : riskSignals),
    [riskSignals, trialId]
  );

  function toggleFinding(row: AiFindingRow) {
    const exists = selectedFactors.some(
      (f) =>
        f.source === row.riskFactor.source &&
        f.kriId === row.riskFactor.kriId &&
        f.qtlId === row.riskFactor.qtlId &&
        f.siteId === row.riskFactor.siteId
    );
    if (exists) {
      setSelectedFactors((prev) =>
        prev.filter(
          (f) =>
            !(
              f.source === row.riskFactor.source &&
              f.kriId === row.riskFactor.kriId &&
              f.qtlId === row.riskFactor.qtlId &&
              f.siteId === row.riskFactor.siteId
            )
        )
      );
    } else {
      setSelectedFactors((prev) => [...prev, row.riskFactor]);
      if (row.siteId) setSiteId(row.siteId);
      if (!trialId) setTrialId(row.trialId);
      if (!title) {
        setTitle(`Site signal: ${row.label}`);
      }
    }
  }

  async function submit(sendNow: boolean) {
    if (!trialId || !siteId) {
      setMessage("Select a trial and target hospital site.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/risk-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trialId,
          siteId,
          raisedByRole: role,
          raisedByName: raisedByName || OVERSIGHT_ROLES.find((r) => r.id === role)?.label,
          title,
          queryText,
          riskFactors: selectedFactors,
          priority,
          sendNow,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Failed to create signal");
        return;
      }
      setMessage(
        sendNow
          ? "Risk signal sent to investigational site."
          : "Draft risk signal saved."
      );
      setTitle("");
      setQueryText("");
      setSelectedFactors([]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendDraft(id: string) {
    setBusy(true);
    try {
      await fetch("/api/risk-signals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "send" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Risk oversight & site queries</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Clinical Operations Lead, Medical Monitor, and Data Management Lead (or delegates) review
          AI-generated RBQM findings and raise formal queries / risk signals to hospital sites with
          linked risk factors.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900">Functional lead context</h3>
          <label className="mt-3 block text-xs text-slate-600">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OversightRole)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {OVERSIGHT_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-[11px] text-slate-500">
            {OVERSIGHT_ROLES.find((r) => r.id === role)?.description}
          </p>
          <label className="mt-3 block text-xs text-slate-600">
            Name (optional)
            <input
              value={raisedByName}
              onChange={(e) => setRaisedByName(e.target.value)}
              placeholder="e.g. Dr. Helen Voss"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="mt-3 block text-xs text-slate-600">
            Trial
            <select
              value={trialId}
              onChange={(e) => {
                setTrialId(e.target.value);
                setSiteId("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All trials</option>
              {trials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.protocolId} — {t.title}
                </option>
              ))}
            </select>
          </label>
          {trial && (
            <label className="mt-3 block text-xs text-slate-600">
              Target hospital site
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Select site…</option>
                {trial.sites.map((s) => (
                  <option key={s.siteId} value={s.siteId}>
                    {s.siteNumber} · {s.hospitalName}, {s.city}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Raise query / risk signal</h3>
            <label className="mt-3 block text-xs text-slate-600">
              Subject
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="Brief signal title for the site"
              />
            </label>
            <label className="mt-3 block text-xs text-slate-600">
              Query text to site
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="Describe required site response, timelines, and corrective actions…"
              />
            </label>
            <label className="mt-3 block text-xs text-slate-600">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RiskSignalPriority)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            {selectedFactors.length > 0 && (
              <div className="mt-3 rounded-lg bg-cyan-50 p-3 ring-1 ring-cyan-100">
                <p className="text-xs font-medium text-cyan-800">Linked AI risk factors</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {selectedFactors.map((f, i) => (
                    <li key={i}>• {f.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {message && <p className="mt-3 text-sm text-cyan-800">{message}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => submit(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => submit(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Send risk signal to site
              </button>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">AI review inbox</h3>
        <p className="mt-1 text-sm text-slate-600">
          Select findings to attach to a site signal. Only automated flags and critical QTL breaches
          are shown.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-3 w-10" />
                <th className="px-3 py-3">Trial / site</th>
                <th className="px-3 py-3">Finding</th>
                <th className="px-3 py-3">Obs / exp</th>
                <th className="px-3 py-3">RR</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No AI-flagged findings for this filter.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((row) => {
                  const checked = selectedFactors.some(
                    (f) =>
                      f.kriId === row.riskFactor.kriId &&
                      f.qtlId === row.riskFactor.qtlId &&
                      f.siteId === row.riskFactor.siteId
                  );
                  return (
                    <tr key={row.findingId} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFinding(row)}
                          aria-label={`Select ${row.label}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/trials/${row.trialId}`}
                          className="text-cyan-700 hover:text-cyan-800"
                        >
                          {row.protocolId}
                        </Link>
                        {row.siteName && (
                          <p className="text-xs text-slate-600">{row.siteName}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{row.label}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">
                        {pct(row.observedRate)} / {pct(row.expectedRate)}
                        {row.absoluteBreach && (
                          <span className="block text-rose-700">QTL breach</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{rrLabel(row.relativeRisk)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.automatedReviewStatus} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Risk signals & queries log</h3>
        <div className="mt-4 space-y-3">
          {filteredSignals.length === 0 ? (
            <p className="text-sm text-slate-500">No risk signals yet.</p>
          ) : (
            filteredSignals.map((s) => (
              <article
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-cyan-700">
                      {s.protocolId} · Site {s.siteName}
                    </p>
                    <h4 className="font-medium text-slate-900">{s.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Raised by {s.raisedByName} · {s.priority} · {s.status}
                    </p>
                  </div>
                  {s.status === "draft" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendDraft(s.id)}
                      className="rounded-lg bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-700 disabled:opacity-50"
                    >
                      Send to site
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-700">{s.queryText}</p>
                {s.riskFactors.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-600">
                    {s.riskFactors.map((f, i) => (
                      <li key={i}>Risk factor: {f.label}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
