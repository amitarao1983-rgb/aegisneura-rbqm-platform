import { TrialsDashboard } from "@/components/TrialsDashboard";
import { runTrialAnalysis } from "@/lib/risk-engine";
import { readPlatform } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await readPlatform();
  const trials = data.trials.map((trial) => ({
    id: trial.id,
    protocolId: trial.protocolId,
    title: trial.title,
    phase: trial.phase,
    status: trial.status,
    analysisSummary: runTrialAnalysis(trial).summary,
  }));

  return <TrialsDashboard trials={trials} />;
}
