import { runTrialAnalysis } from "./risk-engine";
import type {
  AiRiskFactor,
  AutomatedReviewStatus,
  PlatformData,
  Trial,
} from "./types";

export interface AiFindingRow {
  findingId: string;
  trialId: string;
  protocolId: string;
  trialTitle: string;
  siteId?: string;
  siteName?: string;
  label: string;
  source: "kri" | "qtl";
  relativeRisk: number;
  observedRate: number;
  expectedRate: number;
  absoluteLimit?: number;
  absoluteBreach?: boolean;
  automatedReviewStatus: AutomatedReviewStatus;
  riskFactor: AiRiskFactor;
}

export function collectAiFindings(data: PlatformData): AiFindingRow[] {
  const rows: AiFindingRow[] = [];

  for (const trial of data.trials) {
    const analysis = runTrialAnalysis(trial);
    for (const k of analysis.kriResults) {
      if (k.automatedReviewStatus === "pass") continue;
      rows.push({
        findingId: `${trial.id}-${k.siteId}-${k.kriId}`,
        trialId: trial.id,
        protocolId: trial.protocolId,
        trialTitle: trial.title,
        siteId: k.siteId,
        siteName: k.siteName,
        label: k.kriName,
        source: "kri",
        relativeRisk: k.relativeRisk,
        observedRate: k.observedRate,
        expectedRate: k.expectedRate,
        automatedReviewStatus: k.automatedReviewStatus,
        riskFactor: {
          source: "kri",
          kriId: k.kriId,
          siteId: k.siteId,
          label: k.kriName,
          relativeRisk: k.relativeRisk,
          observedRate: k.observedRate,
          expectedRate: k.expectedRate,
          automatedReviewStatus: k.automatedReviewStatus,
        },
      });
    }
    for (const q of analysis.qtlResults) {
      if (q.automatedReviewStatus === "pass") continue;
      rows.push({
        findingId: `${trial.id}-${q.qtlId}`,
        trialId: trial.id,
        protocolId: trial.protocolId,
        trialTitle: trial.title,
        label: q.name,
        source: "qtl",
        relativeRisk: q.relativeRisk,
        observedRate: q.observedRate,
        expectedRate: q.expectedRate,
        absoluteLimit: q.absoluteLimit,
        absoluteBreach: q.absoluteBreach,
        automatedReviewStatus: q.automatedReviewStatus,
        riskFactor: {
          source: "qtl",
          qtlId: q.qtlId,
          label: q.name,
          relativeRisk: q.relativeRisk,
          observedRate: q.observedRate,
          expectedRate: q.expectedRate,
          absoluteLimit: q.absoluteLimit,
          automatedReviewStatus: q.automatedReviewStatus,
        },
      });
    }
  }

  rows.sort((a, b) => {
    const rank = (s: AutomatedReviewStatus) =>
      s === "critical" ? 0 : s === "flagged" ? 1 : 2;
    return rank(a.automatedReviewStatus) - rank(b.automatedReviewStatus);
  });

  return rows;
}

export function siteDisplayName(trial: Trial, siteId: string): string {
  const site = trial.sites?.find((s) => s.siteId === siteId);
  if (site) return `${site.hospitalName} — ${site.city}`;
  const metric = trial.siteMetrics.find((m) => m.siteId === siteId);
  return metric?.siteName ?? siteId;
}
