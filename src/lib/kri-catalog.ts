import type { KriDefinition } from "./types";

export const KRI_CATALOG: KriDefinition[] = [
  {
    id: "ae_rate",
    name: "Adverse event rate",
    category: "safety",
    description: "Proportion of subjects with ≥1 adverse event.",
  },
  {
    id: "sae_rate",
    name: "Serious adverse event rate",
    category: "safety",
    description: "Proportion of subjects with ≥1 serious adverse event.",
  },
  {
    id: "missed_visit_rate",
    name: "Missed visit rate",
    category: "clinical_ops",
    description: "Scheduled visits not completed per protocol.",
  },
  {
    id: "off_schedule_visit_rate",
    name: "Off-schedule visit rate (±2 days)",
    category: "clinical_ops",
    description: "Visits outside visit window of ±2 days from target date.",
  },
  {
    id: "missed_ip_rate",
    name: "Missed IP administration rate",
    category: "clinical_ops",
    description: "Investigational product doses missed vs scheduled.",
  },
  {
    id: "protocol_deviation_rate",
    name: "Protocol deviation rate",
    category: "clinical_ops",
    description: "Deviations per subject exposure.",
  },
];

export function kriById(id: string): KriDefinition | undefined {
  return KRI_CATALOG.find((k) => k.id === id);
}
