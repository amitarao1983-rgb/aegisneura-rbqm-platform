"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { AutomatedReviewStatus } from "@/lib/types";

export type TrialCardData = {
  id: string;
  protocolId: string;
  title: string;
  phase: string;
  status: string;
  analysisSummary?: {
    overallStatus: AutomatedReviewStatus;
    sitesFlagged: number;
    kriElevated: number;
    qtlBreaches: number;
  };
};

export function TrialsDashboard({ trials }: { trials: TrialCardData[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function addTrial() {
    setBusy(true);
    try {
      const res = await fetch("/api/trials", { method: "POST" });
      const json = await res.json();
      if (json.trial?.id) router.push(`/trials/${json.trial.id}`);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Clinical trials</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Each study runs automated KRI review at site level and QTL checks at study level.
            Relative risk compares observed rates to expected benchmarks; absolute limits trigger
            when study metrics cross QTL thresholds.
          </p>
        </div>
        <button
          type="button"
          onClick={addTrial}
          disabled={busy}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Add trial placeholder"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {trials.map((t) => (
          <Link
            key={t.id}
            href={`/trials/${t.id}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                  {t.protocolId} · Phase {t.phase}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900 group-hover:text-cyan-800">
                  {t.title}
                </h3>
              </div>
              {t.analysisSummary && (
                <StatusBadge status={t.analysisSummary.overallStatus} />
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 py-2 ring-1 ring-slate-100">
                <dt className="text-slate-500">Sites flagged</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {t.analysisSummary?.sitesFlagged ?? "—"}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 py-2 ring-1 ring-slate-100">
                <dt className="text-slate-500">KRI elevated</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {t.analysisSummary?.kriElevated ?? "—"}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 py-2 ring-1 ring-slate-100">
                <dt className="text-slate-500">QTL breaches</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {t.analysisSummary?.qtlBreaches ?? "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs capitalize text-slate-500">Status: {t.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
