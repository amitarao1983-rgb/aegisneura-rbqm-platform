import {
  CALL_LABELS,
  DOSE_GROUP_LABELS,
  SEX_LABELS,
  SPECIES_LABELS,
  STAIN_LABELS,
  severityLabel,
} from "./format";
import {
  DILI_DISCLAIMER,
  DILI_MODEL_ID,
  type DiliCall,
  type DiliPrediction,
  type LesionCode,
  type LesionFinding,
  type SeverityGrade,
  type SlideFeatures,
  type Specimen,
  type Stain,
} from "./types";

type FractionKey = keyof Pick<
  SlideFeatures,
  | "necrosisBlockFraction"
  | "vacuoleFraction"
  | "inflammationBlockFraction"
  | "saturatedRedFraction"
  | "pigmentFraction"
  | "collagenFraction"
  | "hypertrophyBlockFraction"
>;

type LesionDraft = {
  code: LesionCode;
  label: string;
  fractionKey: FractionKey;
  cuts: readonly [number, number, number, number];
  contributesToInjury: boolean;
  note: string;
  /** Stains that should score this lesion. Others skip it. */
  stains: readonly Stain[];
};

const LESIONS: LesionDraft[] = [
  {
    code: "necrosis",
    label: "Hepatocellular necrosis pattern",
    fractionKey: "necrosisBlockFraction",
    cuts: [0.08, 0.18, 0.35, 0.6],
    contributesToInjury: true,
    note: "Eosinophilic tissue with very few hematoxylin nuclei. That pattern can be necrosis, but it can also be a pale stain or a field with few cells in focus.",
    stains: ["he", "other"],
  },
  {
    code: "steatosis",
    label: "Vacuolation / steatosis pattern",
    fractionKey: "vacuoleFraction",
    cuts: [0.045, 0.09, 0.16, 0.28],
    contributesToInjury: true,
    note: "Clear spaces fully enclosed by tissue, the pattern used here as a stand-in for macrovesicular vacuolation.",
    stains: ["he", "other", "masson"],
  },
  {
    code: "inflammation",
    label: "Inflammatory-cell pattern",
    fractionKey: "inflammationBlockFraction",
    cuts: [0.08, 0.16, 0.3, 0.5],
    contributesToInjury: true,
    note: "Patches where hematoxylin-stained nuclei are packed much more tightly than in surrounding liver.",
    stains: ["he", "other", "masson"],
  },
  {
    code: "hemorrhage",
    label: "Hemorrhage or congestion",
    fractionKey: "saturatedRedFraction",
    cuts: [0.02, 0.05, 0.1, 0.18],
    contributesToInjury: true,
    note: "Saturated red pixels inside the section. On H&E this can be red blood cells, hemorrhage, or an over-stained fold.",
    stains: ["he", "other", "masson"],
  },
  {
    code: "pigment",
    label: "Brown pigment",
    fractionKey: "pigmentFraction",
    cuts: [0.03, 0.07, 0.12, 0.2],
    contributesToInjury: true,
    note: "Olive-brown pixels. On H&E that can be bile pigment, lipofuscin, or pigment artifact. Cholestasis is not confirmed from color alone.",
    stains: ["he", "other"],
  },
  {
    code: "fibrosis",
    label: "Collagen / fibrosis pattern",
    fractionKey: "collagenFraction",
    cuts: [0.04, 0.08, 0.15, 0.28],
    contributesToInjury: true,
    note: "Blue-green collagen signal. This is informative on a trichrome stain and is easy to over-call on H&E.",
    stains: ["masson"],
  },
  {
    code: "hypertrophy",
    label: "Hepatocellular hypertrophy",
    fractionKey: "hypertrophyBlockFraction",
    cuts: [0.2, 0.35, 0.55, 0.75],
    contributesToInjury: false,
    note: "Eosinophilic cytoplasm with widely spaced nuclei. In rodents this is often adaptive enzyme induction, so it is reported and not scored as injury by itself.",
    stains: ["he", "other", "masson"],
  },
];

function gradeOf(fraction: number, cuts: readonly [number, number, number, number]): SeverityGrade {
  if (fraction < cuts[0]) return 0;
  if (fraction < cuts[1]) return 1;
  if (fraction < cuts[2]) return 2;
  if (fraction < cuts[3]) return 3;
  return 4;
}

function confidenceFor(severity: SeverityGrade, fraction: number, cut: number): number {
  if (severity === 0) return 0;
  const base = [0, 0.44, 0.56, 0.66, 0.75][severity];
  const margin = Math.min(0.06, Math.max(0, fraction - cut));
  return Math.round(Math.min(0.82, base + margin) * 100) / 100;
}

function evaluable(features: SlideFeatures, stain: Stain): string[] {
  const reasons: string[] = [];
  if (features.luminanceStd < 6) {
    reasons.push("The field has almost no stain texture, so it cannot be scored.");
  }
  if (features.sectionFraction < 0.35) {
    reasons.push("Less than about a third of the frame is tissue. Crop to the liver field and try again.");
  }
  if (stain === "oil-red-o") {
    if (
      features.saturatedRedFraction < 0.01 &&
      features.otherFraction > 0.55 &&
      features.eosinFraction < 0.15
    ) {
      reasons.push("This does not look like an Oil Red O field.");
    }
    return reasons;
  }
  if (features.eosinFraction < 0.2 && features.collagenFraction < 0.08) {
    reasons.push("Too little pink eosinophilic cytoplasm for a liver H&E or trichrome field.");
  }
  if (features.otherFraction > 0.45) {
    reasons.push("Too much of the tissue is a color this H&E reader does not recognize.");
  }
  return reasons;
}

function oilRedFindings(features: SlideFeatures): LesionFinding[] {
  const severity = gradeOf(features.saturatedRedFraction, [0.02, 0.06, 0.12, 0.22]);
  if (severity === 0) return [];
  return [
    {
      code: "steatosis",
      label: "Lipid droplets (Oil Red O)",
      severity,
      severityLabel: severityLabel(severity),
      confidence: confidenceFor(severity, features.saturatedRedFraction, 0.02),
      contributesToInjury: true,
      note: "Saturated red droplets on an Oil Red O field, read as neutral lipid. This placeholder does not separate microvesicular from macrovesicular lipid.",
    },
  ];
}

function findingsFor(features: SlideFeatures, stain: Stain): LesionFinding[] {
  if (stain === "oil-red-o") return oilRedFindings(features);
  return LESIONS.filter((lesion) => lesion.stains.includes(stain))
    .map((lesion) => {
      const fraction = features[lesion.fractionKey];
      const severity = gradeOf(fraction, lesion.cuts);
      return {
        code: lesion.code,
        label: lesion.label,
        severity,
        severityLabel: severityLabel(severity),
        confidence: confidenceFor(severity, fraction, lesion.cuts[0]),
        contributesToInjury: lesion.contributesToInjury,
        note: lesion.note,
      };
    })
    .filter((finding) => finding.severity > 0);
}

function maxSeverity(findings: LesionFinding[]): SeverityGrade {
  let max: SeverityGrade = 0;
  for (const finding of findings) {
    if (finding.severity > max) max = finding.severity;
  }
  return max;
}

function decide(findings: LesionFinding[]): { call: DiliCall; injuryScore: number } {
  const injury = findings.filter((f) => f.contributesToInjury);
  const maxSev = maxSeverity(injury);
  const sumSev = injury.reduce((sum, f) => sum + f.severity, 0);
  const scoreBase = [0.08, 0.22, 0.48, 0.71, 0.86][maxSev];
  const injuryScore = Math.round(Math.min(0.9, scoreBase + Math.min(0.06, (sumSev - maxSev) * 0.02)) * 100) / 100;

  const primaryMax = maxSeverity(
    injury.filter(
      (finding) => finding.code === "necrosis" || finding.code === "steatosis" || finding.code === "inflammation"
    )
  );
  let call: DiliCall = "no-injury";
  if (primaryMax >= 3 || maxSev >= 4) call = "dili-suspected";
  else if (maxSev >= 2 || sumSev >= 3) call = "equivocal";

  if (call === "no-injury") return { call, injuryScore: Math.min(injuryScore, 0.2) };
  if (call === "equivocal") return { call, injuryScore: Math.max(0.38, Math.min(injuryScore, 0.64)) };
  return { call, injuryScore: Math.max(0.66, injuryScore) };
}

function narrative(
  specimen: Specimen,
  features: SlideFeatures,
  call: DiliCall,
  findings: LesionFinding[],
  reasons: string[]
): string {
  const who = [
    SEX_LABELS[specimen.sex],
    SPECIES_LABELS[specimen.species],
    specimen.strain ? `(${specimen.strain})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const ids = [
    specimen.animalId ? `animal ${specimen.animalId}` : "",
    specimen.studyId ? `study ${specimen.studyId}` : "",
    specimen.doseGroup !== "other" ? `${DOSE_GROUP_LABELS[specimen.doseGroup].toLowerCase()} group` : "",
    specimen.dose ? specimen.dose : "",
  ].filter(Boolean);
  const header = `${STAIN_LABELS[specimen.stain]} liver field from a ${who}${ids.length ? `, ${ids.join(", ")}` : ""}.`;
  const measured = `The reader sampled ${features.analyzedWidth}×${features.analyzedHeight} pixels from the ${features.sourceWidth}×${features.sourceHeight} image. Section coverage ${pct(features.sectionFraction)}, hematoxylin nuclei ${pct(features.nuclearFraction)}, eosinophilic cytoplasm ${pct(features.eosinFraction)}, enclosed clear space ${pct(features.vacuoleFraction)}.`;

  if (call === "unevaluable") {
    return `${header} ${measured} ${reasons.join(" ")} Whole-slide formats such as SVS and NDPI are not read by this placeholder.`;
  }

  const callSentence =
    call === "no-injury"
      ? "No drug-induced injury pattern was scored in this field."
      : call === "equivocal"
        ? "Changes are present but mild or isolated, so the call stays equivocal until a pathologist reviews the slide."
        : "This field shows a morphologic pattern associated with drug-induced liver injury in rodents.";

  const findingSentence = findings.length
    ? `Reported patterns: ${findings.map((f) => `${f.label.toLowerCase()} (${f.severityLabel.toLowerCase()})`).join("; ")}.`
    : "No graded lesion pattern was above the minimal threshold.";

  const context =
    specimen.doseGroup === "vehicle" && call !== "no-injury"
      ? " The label says vehicle. A pattern in a control is a useful check for stain artifact, a mislabeled slide, or a background lesion."
      : call === "no-injury"
        ? " One negative field does not clear the animal or the dose group."
        : "";
  const stainNote =
    specimen.stain === "he"
      ? " Fibrosis is not scored on H&E."
      : specimen.stain === "oil-red-o"
        ? " Only red lipid droplets are scored on Oil Red O."
        : "";

  return `${header} ${measured} ${callSentence} ${findingSentence}${context}${stainNote} Lobular zone is not assigned, because this single field has no centrilobular or portal landmarks. Grades are INHAND-style (none, minimal, mild, moderate, marked) and still need a pathologist.`;
}

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Placeholder morphology model.
 * Replace this function with a trained model. Keep the DiliPrediction shape
 * and the app, API, and saved cases will keep working.
 */
export function predictFromFeatures(features: SlideFeatures, specimen: Specimen): DiliPrediction {
  const reasons = evaluable(features, specimen.stain);
  if (reasons.length) {
    return {
      modelId: DILI_MODEL_ID,
      modelKind: "placeholder-morphology",
      call: "unevaluable",
      callLabel: CALL_LABELS.unevaluable,
      injuryScore: null,
      overallSeverity: 0,
      overallSeverityLabel: severityLabel(0),
      findings: [],
      features,
      unevaluableReasons: reasons,
      narrative: narrative(specimen, features, "unevaluable", [], reasons),
      disclaimer: DILI_DISCLAIMER,
    };
  }

  const findings = findingsFor(features, specimen.stain);
  const decision = decide(findings);
  const overallSeverity = maxSeverity(findings.filter((f) => f.contributesToInjury));

  return {
    modelId: DILI_MODEL_ID,
    modelKind: "placeholder-morphology",
    call: decision.call,
    callLabel: CALL_LABELS[decision.call],
    injuryScore: decision.injuryScore,
    overallSeverity,
    overallSeverityLabel: severityLabel(overallSeverity),
    findings,
    features,
    unevaluableReasons: [],
    narrative: narrative(specimen, features, decision.call, findings, []),
    disclaimer: DILI_DISCLAIMER,
  };
}
