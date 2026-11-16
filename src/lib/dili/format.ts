import type { DiliCall, DoseGroup, SeverityGrade, Sex, Species, Stain } from "./types";

export const SEVERITY_LABELS = ["None", "Minimal", "Mild", "Moderate", "Marked"] as const;

export const CALL_LABELS: Record<DiliCall, string> = {
  "no-injury": "No injury pattern",
  equivocal: "Equivocal",
  "dili-suspected": "DILI pattern suspected",
  unevaluable: "Could not read this field",
};

export const SPECIES_LABELS: Record<Species, string> = {
  rat: "rat",
  mouse: "mouse",
  hamster: "hamster",
  "guinea-pig": "guinea pig",
  "other-rodent": "rodent",
};

export const SEX_LABELS: Record<Sex, string> = {
  female: "female",
  male: "male",
  unspecified: "unspecified sex",
};

export const DOSE_GROUP_LABELS: Record<DoseGroup, string> = {
  vehicle: "Vehicle",
  low: "Low dose",
  mid: "Mid dose",
  high: "High dose",
  other: "Other",
};

export const STAIN_LABELS: Record<Stain, string> = {
  he: "H&E",
  masson: "Masson trichrome",
  "oil-red-o": "Oil Red O",
  other: "Other stain",
};

export function severityLabel(grade: SeverityGrade): string {
  return SEVERITY_LABELS[grade];
}

export function callLabel(call: DiliCall): string {
  return CALL_LABELS[call];
}
