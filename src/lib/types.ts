export type TrialStatus = "active" | "planned" | "closed";

export type KriCategory = "safety" | "clinical_ops";

export interface KriDefinition {
  id: string;
  name: string;
  category: KriCategory;
  description: string;
}

export interface TrialSite {
  siteId: string;
  siteNumber: string;
  hospitalName: string;
  city: string;
  country: string;
  principalInvestigator: string;
}

export interface SiteKriMetrics {
  siteId: string;
  siteName: string;
  kriId: string;
  numerator: number;
  denominator: number;
}

export interface StudyQtl {
  qtlId: string;
  name: string;
  /** Study-wide absolute tolerance (rate 0–1) */
  absoluteLimit: number;
  /** Expected study benchmark for relative risk */
  expectedRate: number;
  observedNumerator: number;
  observedDenominator: number;
}

export interface Trial {
  id: string;
  protocolId: string;
  title: string;
  phase: string;
  status: TrialStatus;
  sponsor: string;
  edcConnectorId: string | null;
  /** Investigational sites (hospitals / clinics), typically 4–5 per trial */
  sites: TrialSite[];
  siteMetrics: SiteKriMetrics[];
  qtls: StudyQtl[];
  lastAutomatedReviewAt: string | null;
}

export type RelativeRiskStatus = "within_expected" | "elevated";

export type AutomatedReviewStatus = "pass" | "flagged" | "critical";

export interface KriRiskResult {
  trialId: string;
  siteId: string;
  siteName: string;
  kriId: string;
  kriName: string;
  category: KriCategory;
  observedRate: number;
  expectedRate: number;
  relativeRisk: number;
  relativeRiskStatus: RelativeRiskStatus;
  automatedReviewStatus: AutomatedReviewStatus;
}

export interface QtlRiskResult {
  trialId: string;
  qtlId: string;
  name: string;
  observedRate: number;
  expectedRate: number;
  absoluteLimit: number;
  relativeRisk: number;
  relativeRiskStatus: RelativeRiskStatus;
  absoluteBreach: boolean;
  automatedReviewStatus: AutomatedReviewStatus;
}

export interface TrialAnalysis {
  trialId: string;
  reviewedAt: string;
  kriResults: KriRiskResult[];
  qtlResults: QtlRiskResult[];
  summary: {
    sitesFlagged: number;
    kriElevated: number;
    qtlBreaches: number;
    overallStatus: AutomatedReviewStatus;
  };
}

export type EdcVendor = "medidata_rave" | "oracle_clinical_one" | "veeva_cdms" | "custom_rest";

export interface EdcConnector {
  id: string;
  name: string;
  vendor: EdcVendor;
  baseUrl: string;
  apiKeyPlaceholder: string;
  trialIds: string[];
  syncCronMinutes: number;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: "idle" | "success" | "error";
  lastSyncMessage: string;
}

export interface UploadedFileRecord {
  id: string;
  trialId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  uploadedAt: string;
}

export type OversightRole =
  | "clinical_ops_lead"
  | "medical_monitor"
  | "data_management_lead"
  | "delegate";

export interface AiRiskFactor {
  source: "kri" | "qtl";
  kriId?: string;
  qtlId?: string;
  siteId?: string;
  label: string;
  relativeRisk?: number;
  observedRate?: number;
  expectedRate?: number;
  absoluteLimit?: number;
  automatedReviewStatus: AutomatedReviewStatus;
}

export type RiskSignalStatus =
  | "draft"
  | "sent"
  | "acknowledged"
  | "responded"
  | "closed";

export type RiskSignalPriority = "routine" | "urgent" | "critical";

/** Query / risk signal dispatched to an investigational site */
export interface RiskSignal {
  id: string;
  trialId: string;
  protocolId: string;
  siteId: string;
  siteName: string;
  raisedByRole: OversightRole;
  raisedByName: string;
  title: string;
  queryText: string;
  riskFactors: AiRiskFactor[];
  priority: RiskSignalPriority;
  status: RiskSignalStatus;
  createdAt: string;
  sentAt: string | null;
}

export interface PlatformData {
  trials: Trial[];
  connectors: EdcConnector[];
  uploads: UploadedFileRecord[];
  riskSignals: RiskSignal[];
}
