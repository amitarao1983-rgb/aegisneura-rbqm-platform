import { kriById } from "./kri-catalog";
import type {
  AutomatedReviewStatus,
  KriRiskResult,
  QtlRiskResult,
  RelativeRiskStatus,
  SiteKriMetrics,
  StudyQtl,
  Trial,
  TrialAnalysis,
} from "./types";

const RELATIVE_RISK_ELEVATED = 1.25;

export function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function relativeRisk(observed: number, expected: number): number {
  if (expected <= 0) return observed > 0 ? Infinity : 1;
  return observed / expected;
}

function relativeStatus(rr: number): RelativeRiskStatus {
  return rr >= RELATIVE_RISK_ELEVATED ? "elevated" : "within_expected";
}

function statusFromFlags(
  elevated: boolean,
  breach: boolean
): AutomatedReviewStatus {
  if (breach) return "critical";
  if (elevated) return "flagged";
  return "pass";
}

/** Expected site rate derived from study QTL benchmark when KRI maps to a QTL id. */
const KRI_TO_EXPECTED_QTL: Record<string, string> = {
  sae_rate: "qtl_sae_rate",
  missed_ip_rate: "qtl_missed_ip",
};

function expectedRateForKri(trial: Trial, kriId: string): number {
  const qtlId = KRI_TO_EXPECTED_QTL[kriId];
  const qtl = trial.qtls.find((q) => q.qtlId === qtlId);
  if (qtl) return qtl.expectedRate;

  const studyRates = trial.siteMetrics
    .filter((m) => m.kriId === kriId)
    .map((m) => rate(m.numerator, m.denominator));
  if (studyRates.length === 0) return 0.05;
  const sum = studyRates.reduce((a, b) => a + b, 0);
  return sum / studyRates.length;
}

export function analyzeSiteKris(trial: Trial): KriRiskResult[] {
  const results: KriRiskResult[] = [];

  for (const row of trial.siteMetrics) {
    const def = kriById(row.kriId);
    if (!def) continue;

    const observed = rate(row.numerator, row.denominator);
    const expected = expectedRateForKri(trial, row.kriId);
    const rr = relativeRisk(observed, expected);
    const rrStatus = relativeStatus(rr);
    const autoStatus = statusFromFlags(rrStatus === "elevated", false);

    results.push({
      trialId: trial.id,
      siteId: row.siteId,
      siteName: row.siteName,
      kriId: row.kriId,
      kriName: def.name,
      category: def.category,
      observedRate: observed,
      expectedRate: expected,
      relativeRisk: rr,
      relativeRiskStatus: rrStatus,
      automatedReviewStatus: autoStatus,
    });
  }

  return results;
}

export function analyzeQtls(trial: Trial): QtlRiskResult[] {
  return trial.qtls.map((q) => analyzeSingleQtl(trial.id, q));
}

function analyzeSingleQtl(trialId: string, q: StudyQtl): QtlRiskResult {
  const observed = rate(q.observedNumerator, q.observedDenominator);
  const rr = relativeRisk(observed, q.expectedRate);
  const rrStatus = relativeStatus(rr);
  const breach = observed > q.absoluteLimit;
  const autoStatus = statusFromFlags(rrStatus === "elevated", breach);

  return {
    trialId,
    qtlId: q.qtlId,
    name: q.name,
    observedRate: observed,
    expectedRate: q.expectedRate,
    absoluteLimit: q.absoluteLimit,
    relativeRisk: rr,
    relativeRiskStatus: rrStatus,
    absoluteBreach: breach,
    automatedReviewStatus: autoStatus,
  };
}

export function runTrialAnalysis(trial: Trial): TrialAnalysis {
  const kriResults = analyzeSiteKris(trial);
  const qtlResults = analyzeQtls(trial);
  const reviewedAt = new Date().toISOString();

  const sitesFlagged = new Set(
    kriResults
      .filter((r) => r.automatedReviewStatus !== "pass")
      .map((r) => r.siteId)
  ).size;

  const kriElevated = kriResults.filter(
    (r) => r.relativeRiskStatus === "elevated"
  ).length;
  const qtlBreaches = qtlResults.filter((r) => r.absoluteBreach).length;

  let overallStatus: AutomatedReviewStatus = "pass";
  if (qtlBreaches > 0 || kriResults.some((r) => r.automatedReviewStatus === "critical")) {
    overallStatus = "critical";
  } else if (kriElevated > 0 || qtlResults.some((r) => r.relativeRiskStatus === "elevated")) {
    overallStatus = "flagged";
  }

  return {
    trialId: trial.id,
    reviewedAt,
    kriResults,
    qtlResults,
    summary: {
      sitesFlagged,
      kriElevated,
      qtlBreaches,
      overallStatus,
    },
  };
}

export function perturbMetrics(metrics: SiteKriMetrics[]): SiteKriMetrics[] {
  return metrics.map((m) => {
    const delta = Math.floor(Math.random() * 3) - 1;
    const num = Math.max(0, m.numerator + delta);
    const denom = Math.max(num, m.denominator);
    return { ...m, numerator: num, denominator: denom };
  });
}
