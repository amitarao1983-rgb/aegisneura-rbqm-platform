import Link from "next/link";
import { notFound } from "next/navigation";
import { TrialAnalysisView } from "@/components/TrialAnalysisView";
import { TrialReviewActions } from "@/components/TrialReviewActions";
import { TrialSitesPanel } from "@/components/TrialSitesPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { runTrialAnalysis } from "@/lib/risk-engine";
import { readPlatform, getTrial } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TrialDetailPage({ params }: Props) {
  const { id } = await params;
  const trial = await getTrial(id);
  if (!trial) notFound();

  const data = await readPlatform();
  const trialSignals = data.riskSignals.filter((s) => s.trialId === id);
  const analysis = runTrialAnalysis(trial);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-cyan-700 hover:text-cyan-800">
            ← All trials
          </Link>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-cyan-700">
            {trial.protocolId} · Phase {trial.phase}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{trial.title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Sponsor {trial.sponsor} · {trial.status}
            {trial.edcConnectorId && (
              <> · EDC connector {trial.edcConnectorId}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={analysis.summary.overallStatus} />
          <TrialReviewActions trialId={trial.id} />
        </div>
      </div>
      <TrialSitesPanel trial={trial} riskSignals={trialSignals} />
      <TrialAnalysisView analysis={analysis} />
    </div>
  );
}
