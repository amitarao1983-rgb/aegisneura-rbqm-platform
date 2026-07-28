import Link from "next/link";
import type { RiskSignal, Trial, TrialSite } from "@/lib/types";

export function TrialSitesPanel({
  trial,
  riskSignals,
}: {
  trial: Trial;
  riskSignals: RiskSignal[];
}) {
  const sites: TrialSite[] = trial.sites ?? [];
  const signalsBySite = new Map<string, RiskSignal[]>();
  for (const s of riskSignals) {
    const list = signalsBySite.get(s.siteId) ?? [];
    list.push(s);
    signalsBySite.set(s.siteId, list);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Investigational sites</h3>
          <p className="mt-1 text-sm text-slate-600">
            {sites.length} hospital{sites.length === 1 ? "" : "s"} on this trial — raise site-specific
            risk signals from the oversight workbench.
          </p>
        </div>
        <Link
          href={`/oversight?trial=${trial.id}`}
          className="rounded-lg border border-cyan-600 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800 hover:bg-cyan-100"
        >
          Open oversight for this trial
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sites.map((site) => {
          const sent = signalsBySite.get(site.siteId)?.filter((s) => s.status !== "draft") ?? [];
          return (
            <div
              key={site.siteId}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-medium text-cyan-700">Site {site.siteNumber}</p>
              <h4 className="font-medium text-slate-900">{site.hospitalName}</h4>
              <p className="text-xs text-slate-600">
                {site.city}, {site.country} · PI {site.principalInvestigator}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {sent.length === 0
                  ? "No risk signals sent"
                  : `${sent.length} signal(s) dispatched to site`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
