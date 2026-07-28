import { NextResponse } from "next/server";
import { runTrialAnalysis } from "@/lib/risk-engine";
import { readPlatform, updateTrial } from "@/lib/store";

export async function GET() {
  const data = await readPlatform();
  const trials = data.trials.map((trial) => {
    const analysis = runTrialAnalysis(trial);
    return {
      ...trial,
      analysisSummary: analysis.summary,
      lastAutomatedReviewAt: trial.lastAutomatedReviewAt ?? analysis.reviewedAt,
    };
  });
  return NextResponse.json({ trials });
}

export async function POST() {
  const data = await readPlatform();
  const id = `trial-neura-${String(data.trials.length + 1).padStart(3, "0")}`;
  const trial = {
    id,
    protocolId: "AN-NEW-000",
    title: "New study placeholder",
    phase: "I",
    status: "planned" as const,
    sponsor: "AegisNeura Therapeutics",
    edcConnectorId: null,
    lastAutomatedReviewAt: null,
    sites: [
      {
        siteId: `${id}-s1`,
        siteNumber: "001",
        hospitalName: "Placeholder Hospital A",
        city: "TBD",
        country: "TBD",
        principalInvestigator: "TBD",
      },
      {
        siteId: `${id}-s2`,
        siteNumber: "002",
        hospitalName: "Placeholder Hospital B",
        city: "TBD",
        country: "TBD",
        principalInvestigator: "TBD",
      },
      {
        siteId: `${id}-s3`,
        siteNumber: "003",
        hospitalName: "Placeholder Hospital C",
        city: "TBD",
        country: "TBD",
        principalInvestigator: "TBD",
      },
      {
        siteId: `${id}-s4`,
        siteNumber: "004",
        hospitalName: "Placeholder Hospital D",
        city: "TBD",
        country: "TBD",
        principalInvestigator: "TBD",
      },
      {
        siteId: `${id}-s5`,
        siteNumber: "005",
        hospitalName: "Placeholder Hospital E",
        city: "TBD",
        country: "TBD",
        principalInvestigator: "TBD",
      },
    ],
    qtls: [
      {
        qtlId: "qtl_missed_assessment",
        name: "Missed assessment rate",
        absoluteLimit: 0.08,
        expectedRate: 0.04,
        observedNumerator: 0,
        observedDenominator: 0,
      },
      {
        qtlId: "qtl_missed_ip",
        name: "Missed IP rate",
        absoluteLimit: 0.06,
        expectedRate: 0.025,
        observedNumerator: 0,
        observedDenominator: 0,
      },
      {
        qtlId: "qtl_sae_rate",
        name: "Serious adverse event rate",
        absoluteLimit: 0.12,
        expectedRate: 0.07,
        observedNumerator: 0,
        observedDenominator: 0,
      },
    ],
    siteMetrics: [],
  };
  data.trials.push(trial);
  await updateTrial(trial);
  return NextResponse.json({ trial }, { status: 201 });
}
