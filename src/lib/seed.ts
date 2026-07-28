import type {
  AiRiskFactor,
  EdcConnector,
  PlatformData,
  RiskSignal,
  Trial,
  TrialSite,
} from "./types";

function siteRow(
  siteId: string,
  siteName: string,
  kriId: string,
  numerator: number,
  denominator: number
) {
  return { siteId, siteName, kriId, numerator, denominator };
}

function metricsForSite(
  siteId: string,
  siteName: string,
  profile: "low" | "medium" | "high"
): ReturnType<typeof siteRow>[] {
  const profiles = {
    low: {
      ae: [35, 50],
      sae: [2, 50],
      missedVisit: [2, 125],
      offSched: [4, 125],
      missedIp: [1, 100],
      pd: [2, 50],
    },
    medium: {
      ae: [38, 52],
      sae: [5, 52],
      missedVisit: [5, 130],
      offSched: [9, 130],
      missedIp: [3, 104],
      pd: [4, 52],
    },
    high: {
      ae: [42, 48],
      sae: [9, 48],
      missedVisit: [8, 120],
      offSched: [12, 120],
      missedIp: [6, 96],
      pd: [7, 48],
    },
  };
  const p = profiles[profile];
  return [
    siteRow(siteId, siteName, "ae_rate", p.ae[0], p.ae[1]),
    siteRow(siteId, siteName, "sae_rate", p.sae[0], p.sae[1]),
    siteRow(siteId, siteName, "missed_visit_rate", p.missedVisit[0], p.missedVisit[1]),
    siteRow(
      siteId,
      siteName,
      "off_schedule_visit_rate",
      p.offSched[0],
      p.offSched[1]
    ),
    siteRow(siteId, siteName, "missed_ip_rate", p.missedIp[0], p.missedIp[1]),
    siteRow(siteId, siteName, "protocol_deviation_rate", p.pd[0], p.pd[1]),
  ];
}

const alphaSites: TrialSite[] = [
  {
    siteId: "site-101",
    siteNumber: "101",
    hospitalName: "Memorial Research Hospital",
    city: "Boston",
    country: "USA",
    principalInvestigator: "Dr. Elena Marsh",
  },
  {
    siteId: "site-204",
    siteNumber: "204",
    hospitalName: "Lakeview Clinical Center",
    city: "Chicago",
    country: "USA",
    principalInvestigator: "Dr. James Okonkwo",
  },
  {
    siteId: "site-318",
    siteNumber: "318",
    hospitalName: "Pacific Trials Medical Group",
    city: "San Diego",
    country: "USA",
    principalInvestigator: "Dr. Sofia Alvarez",
  },
  {
    siteId: "site-445",
    siteNumber: "445",
    hospitalName: "Harborview Oncology Institute",
    city: "Baltimore",
    country: "USA",
    principalInvestigator: "Dr. Michael Chen",
  },
  {
    siteId: "site-512",
    siteNumber: "512",
    hospitalName: "Texas Oncology Center",
    city: "Houston",
    country: "USA",
    principalInvestigator: "Dr. Priya Nair",
  },
];

const trialAlpha: Trial = {
  id: "trial-neura-001",
  protocolId: "AN-ONC-001",
  title: "NeuraBlock Phase II in Advanced Solid Tumors",
  phase: "II",
  status: "active",
  sponsor: "AegisNeura Therapeutics",
  edcConnectorId: "edc-rave-prod",
  lastAutomatedReviewAt: null,
  sites: alphaSites,
  qtls: [
    {
      qtlId: "qtl_missed_assessment",
      name: "Missed assessment rate",
      absoluteLimit: 0.08,
      expectedRate: 0.04,
      observedNumerator: 18,
      observedDenominator: 420,
    },
    {
      qtlId: "qtl_missed_ip",
      name: "Missed IP rate",
      absoluteLimit: 0.06,
      expectedRate: 0.025,
      observedNumerator: 11,
      observedDenominator: 420,
    },
    {
      qtlId: "qtl_sae_rate",
      name: "Serious adverse event rate",
      absoluteLimit: 0.12,
      expectedRate: 0.07,
      observedNumerator: 32,
      observedDenominator: 420,
    },
  ],
  siteMetrics: [
    ...metricsForSite("site-101", "Memorial Research — Boston", "medium"),
    ...metricsForSite("site-204", "Lakeview Clinical — Chicago", "high"),
    ...metricsForSite("site-318", "Pacific Trials — San Diego", "low"),
    ...metricsForSite("site-445", "Harborview Oncology — Baltimore", "medium"),
    ...metricsForSite("site-512", "Texas Oncology — Houston", "low"),
  ],
};

const betaSites: TrialSite[] = [
  {
    siteId: "site-401",
    siteNumber: "401",
    hospitalName: "Nordic Neuroscience Hospital",
    city: "Oslo",
    country: "Norway",
    principalInvestigator: "Dr. Lars Holm",
  },
  {
    siteId: "site-522",
    siteNumber: "522",
    hospitalName: "Central EU University Hospital",
    city: "Berlin",
    country: "Germany",
    principalInvestigator: "Dr. Anna Weber",
  },
  {
    siteId: "site-601",
    siteNumber: "601",
    hospitalName: "UK Neuroscience Centre",
    city: "London",
    country: "United Kingdom",
    principalInvestigator: "Dr. Rachel Hughes",
  },
  {
    siteId: "site-702",
    siteNumber: "702",
    hospitalName: "Paris Santé Neurologique",
    city: "Paris",
    country: "France",
    principalInvestigator: "Dr. Luc Moreau",
  },
  {
    siteId: "site-803",
    siteNumber: "803",
    hospitalName: "Milan MS Research Hospital",
    city: "Milan",
    country: "Italy",
    principalInvestigator: "Dr. Giulia Romano",
  },
];

const trialBeta: Trial = {
  id: "trial-neura-002",
  protocolId: "AN-CNS-004",
  title: "NeuraMind Phase III in Relapsing MS",
  phase: "III",
  status: "active",
  sponsor: "AegisNeura Therapeutics",
  edcConnectorId: "edc-oracle-qa",
  lastAutomatedReviewAt: null,
  sites: betaSites,
  qtls: [
    {
      qtlId: "qtl_missed_assessment",
      name: "Missed assessment rate",
      absoluteLimit: 0.05,
      expectedRate: 0.02,
      observedNumerator: 45,
      observedDenominator: 980,
    },
    {
      qtlId: "qtl_missed_ip",
      name: "Missed IP rate",
      absoluteLimit: 0.04,
      expectedRate: 0.015,
      observedNumerator: 22,
      observedDenominator: 980,
    },
    {
      qtlId: "qtl_sae_rate",
      name: "Serious adverse event rate",
      absoluteLimit: 0.09,
      expectedRate: 0.05,
      observedNumerator: 41,
      observedDenominator: 980,
    },
  ],
  siteMetrics: [
    ...metricsForSite("site-401", "Nordic Neuro — Oslo", "low"),
    ...metricsForSite("site-522", "Central EU Hospital — Berlin", "high"),
    ...metricsForSite("site-601", "UK Neuroscience — London", "medium"),
    ...metricsForSite("site-702", "Paris Santé — Paris", "medium"),
    ...metricsForSite("site-803", "Milan MS Center — Milan", "low"),
  ],
};

const gammaSites: TrialSite[] = [
  {
    siteId: "site-901",
    siteNumber: "901",
    hospitalName: "Royal Cardiac Hospital",
    city: "Edinburgh",
    country: "United Kingdom",
    principalInvestigator: "Dr. Fiona Reid",
  },
  {
    siteId: "site-902",
    siteNumber: "902",
    hospitalName: "Amsterdam Heart Institute",
    city: "Amsterdam",
    country: "Netherlands",
    principalInvestigator: "Dr. Pieter de Vries",
  },
  {
    siteId: "site-903",
    siteNumber: "903",
    hospitalName: "Barcelona CV Research Unit",
    city: "Barcelona",
    country: "Spain",
    principalInvestigator: "Dr. Carmen Ruiz",
  },
  {
    siteId: "site-904",
    siteNumber: "904",
    hospitalName: "Zurich Early Phase Unit",
    city: "Zurich",
    country: "Switzerland",
    principalInvestigator: "Dr. Thomas Keller",
  },
  {
    siteId: "site-905",
    siteNumber: "905",
    hospitalName: "Copenhagen FIH Centre",
    city: "Copenhagen",
    country: "Denmark",
    principalInvestigator: "Dr. Mette Larsen",
  },
];

const trialGamma: Trial = {
  id: "trial-neura-003",
  protocolId: "AN-CV-010",
  title: "CardioShield Phase I First-in-Human",
  phase: "I",
  status: "planned",
  sponsor: "AegisNeura Therapeutics",
  edcConnectorId: null,
  lastAutomatedReviewAt: null,
  sites: gammaSites,
  qtls: [
    {
      qtlId: "qtl_missed_assessment",
      name: "Missed assessment rate",
      absoluteLimit: 0.1,
      expectedRate: 0.05,
      observedNumerator: 0,
      observedDenominator: 0,
    },
    {
      qtlId: "qtl_missed_ip",
      name: "Missed IP rate",
      absoluteLimit: 0.08,
      expectedRate: 0.03,
      observedNumerator: 0,
      observedDenominator: 0,
    },
    {
      qtlId: "qtl_sae_rate",
      name: "Serious adverse event rate",
      absoluteLimit: 0.15,
      expectedRate: 0.08,
      observedNumerator: 0,
      observedDenominator: 0,
    },
  ],
  siteMetrics: [],
};

const connectors: EdcConnector[] = [
  {
    id: "edc-rave-prod",
    name: "Medidata Rave — Production",
    vendor: "medidata_rave",
    baseUrl: "https://edc.example.com/rave/api/v1",
    apiKeyPlaceholder: "••••••••••••RAVE",
    trialIds: ["trial-neura-001"],
    syncCronMinutes: 60,
    enabled: true,
    lastSyncAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "Awaiting first automated sync.",
  },
  {
    id: "edc-oracle-qa",
    name: "Oracle Clinical One — QA",
    vendor: "oracle_clinical_one",
    baseUrl: "https://clinical-one.example.com/api",
    apiKeyPlaceholder: "••••••••••••OC1",
    trialIds: ["trial-neura-002"],
    syncCronMinutes: 120,
    enabled: true,
    lastSyncAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "Awaiting first automated sync.",
  },
  {
    id: "edc-veeva-staging",
    name: "Veeva CDMS — Staging",
    vendor: "veeva_cdms",
    baseUrl: "https://cdms.veeva.example.com/rest",
    apiKeyPlaceholder: "••••••••••••VEEVA",
    trialIds: [],
    syncCronMinutes: 240,
    enabled: false,
    lastSyncAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "Connector disabled.",
  },
];

const seedRiskFactorsChicago: AiRiskFactor[] = [
  {
    source: "kri",
    kriId: "sae_rate",
    siteId: "site-204",
    label: "Serious adverse event rate — elevated relative risk",
    relativeRisk: 1.42,
    observedRate: 0.173,
    expectedRate: 0.122,
    automatedReviewStatus: "flagged",
  },
  {
    source: "kri",
    kriId: "off_schedule_visit_rate",
    siteId: "site-204",
    label: "Off-schedule visit rate (±2 days)",
    relativeRisk: 1.31,
    observedRate: 0.092,
    expectedRate: 0.07,
    automatedReviewStatus: "flagged",
  },
];

const riskSignals: RiskSignal[] = [
  {
    id: "rs-001",
    trialId: "trial-neura-001",
    protocolId: "AN-ONC-001",
    siteId: "site-204",
    siteName: "Lakeview Clinical — Chicago",
    raisedByRole: "medical_monitor",
    raisedByName: "Dr. Helen Voss (Medical Monitor)",
    title: "Elevated SAE rate — site clarification requested",
    queryText:
      "Automated RBQM review flagged an elevated serious adverse event rate and off-schedule visits at Site 204. Please provide root-cause assessment, affected subject IDs (masked as per SOP), and corrective actions within 5 business days.",
    riskFactors: seedRiskFactorsChicago,
    priority: "urgent",
    status: "sent",
    createdAt: "2026-07-18T09:30:00.000Z",
    sentAt: "2026-07-18T09:45:00.000Z",
  },
  {
    id: "rs-002",
    trialId: "trial-neura-002",
    protocolId: "AN-CNS-004",
    siteId: "site-522",
    siteName: "Central EU Hospital — Berlin",
    raisedByRole: "clinical_ops_lead",
    raisedByName: "Sarah Klein (Clinical Ops Lead)",
    title: "Protocol deviation cluster — draft signal",
    queryText:
      "Draft: AI review indicates elevated protocol deviation and missed visit rates. Confirm before sending to site PI and CRA.",
    riskFactors: [
      {
        source: "kri",
        kriId: "protocol_deviation_rate",
        siteId: "site-522",
        label: "Protocol deviation rate",
        relativeRisk: 1.38,
        observedRate: 0.121,
        expectedRate: 0.088,
        automatedReviewStatus: "flagged",
      },
    ],
    priority: "routine",
    status: "draft",
    createdAt: "2026-07-20T08:00:00.000Z",
    sentAt: null,
  },
];

export const SEED_DATA: PlatformData = {
  trials: [trialAlpha, trialBeta, trialGamma],
  connectors,
  uploads: [],
  riskSignals,
};
