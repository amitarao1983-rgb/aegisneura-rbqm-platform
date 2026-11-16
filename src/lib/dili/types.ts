/** Rodent drug-induced liver injury read. Research placeholder, not a diagnostic device. */

export const DILI_MODEL_ID = "he-morphology-placeholder-v1";

export const DILI_DISCLAIMER =
  "Research placeholder for preclinical teaching and study triage. The score comes from stain colors in this single field. It is not a validated diagnostic model, it does not replace a veterinary pathologist, and it must not be the sole basis for a safety decision. Replace predictFromFeatures with a trained whole-slide model before any study use.";

export type Species = "rat" | "mouse" | "hamster" | "guinea-pig" | "other-rodent";
export type Sex = "female" | "male" | "unspecified";
export type DoseGroup = "vehicle" | "low" | "mid" | "high" | "other";
export type Stain = "he" | "masson" | "oil-red-o" | "other";
export type SeverityGrade = 0 | 1 | 2 | 3 | 4;
export type DiliCall = "no-injury" | "equivocal" | "dili-suspected" | "unevaluable";

export type LesionCode =
  | "necrosis"
  | "steatosis"
  | "inflammation"
  | "hemorrhage"
  | "pigment"
  | "hypertrophy"
  | "fibrosis";

export type Specimen = {
  species: Species;
  strain: string;
  sex: Sex;
  studyId: string;
  animalId: string;
  doseGroup: DoseGroup;
  dose: string;
  stain: Stain;
  organ: "liver";
  filename: string;
};

export type SlideFeatures = {
  sourceWidth: number;
  sourceHeight: number;
  analyzedWidth: number;
  analyzedHeight: number;
  /** Share of the frame that is section rather than glass, black border, or margin. */
  sectionFraction: number;
  /** Shares below are of cellular tissue, except vacuoleFraction which is of the section. */
  nuclearFraction: number;
  eosinFraction: number;
  vacuoleFraction: number;
  saturatedRedFraction: number;
  pigmentFraction: number;
  collagenFraction: number;
  otherFraction: number;
  /** Standard deviation of tissue luminance, 0–255. Near zero means a flat image. */
  luminanceStd: number;
  necrosisBlockFraction: number;
  inflammationBlockFraction: number;
  hypertrophyBlockFraction: number;
};

export type LesionFinding = {
  code: LesionCode;
  label: string;
  severity: SeverityGrade;
  severityLabel: string;
  confidence: number;
  contributesToInjury: boolean;
  note: string;
};

export type DiliPrediction = {
  modelId: string;
  modelKind: "placeholder-morphology";
  call: DiliCall;
  callLabel: string;
  /** 0–1 placeholder score. Not a calibrated clinical probability. */
  injuryScore: number | null;
  overallSeverity: SeverityGrade;
  overallSeverityLabel: string;
  findings: LesionFinding[];
  features: SlideFeatures;
  unevaluableReasons: string[];
  narrative: string;
  disclaimer: string;
};

export type DiliImageMeta = {
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export type DiliCase = {
  id: string;
  createdAt: string;
  specimen: Specimen;
  image: DiliImageMeta;
  prediction: DiliPrediction;
};
