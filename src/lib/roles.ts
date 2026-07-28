import type { OversightRole } from "./types";

export const OVERSIGHT_ROLES: {
  id: OversightRole;
  label: string;
  description: string;
}[] = [
  {
    id: "clinical_ops_lead",
    label: "Clinical Operations Lead",
    description: "Oversight of visit, IP, and protocol deviation signals",
  },
  {
    id: "medical_monitor",
    label: "Medical Monitor",
    description: "Oversight of safety KRIs and SAE-related findings",
  },
  {
    id: "data_management_lead",
    label: "Data Management Lead",
    description: "Oversight of data quality, assessments, and EDC consistency",
  },
  {
    id: "delegate",
    label: "Designated subordinate",
    description: "Raise queries on behalf of a functional lead",
  },
];

export function roleLabel(role: OversightRole): string {
  return OVERSIGHT_ROLES.find((r) => r.id === role)?.label ?? role;
}
