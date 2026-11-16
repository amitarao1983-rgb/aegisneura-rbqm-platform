import type { DoseGroup, Sex, Species, Specimen, Stain } from "./types";

export const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: "rat", label: "Rat" },
  { value: "mouse", label: "Mouse" },
  { value: "hamster", label: "Hamster" },
  { value: "guinea-pig", label: "Guinea pig" },
  { value: "other-rodent", label: "Other rodent" },
];

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unspecified", label: "Unspecified" },
];

export const DOSE_GROUP_OPTIONS: { value: DoseGroup; label: string }[] = [
  { value: "vehicle", label: "Vehicle" },
  { value: "low", label: "Low" },
  { value: "mid", label: "Mid" },
  { value: "high", label: "High" },
  { value: "other", label: "Other / not set" },
];

export const STAIN_OPTIONS: { value: Stain; label: string }[] = [
  { value: "he", label: "H&E" },
  { value: "masson", label: "Masson trichrome" },
  { value: "oil-red-o", label: "Oil Red O" },
  { value: "other", label: "Other" },
];

const SPECIES = new Set<string>(SPECIES_OPTIONS.map((o) => o.value));
const SEX = new Set<string>(SEX_OPTIONS.map((o) => o.value));
const DOSE = new Set<string>(DOSE_GROUP_OPTIONS.map((o) => o.value));
const STAIN = new Set<string>(STAIN_OPTIONS.map((o) => o.value));

function field(form: FormData, key: string, max: number): string {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function parseSpecimen(
  form: FormData,
  filename: string
): { ok: true; value: Specimen } | { ok: false; error: string } {
  const species = field(form, "species", 40);
  const sex = field(form, "sex", 20) || "unspecified";
  const doseGroup = field(form, "doseGroup", 20) || "other";
  const stain = field(form, "stain", 20) || "he";

  if (!SPECIES.has(species)) {
    return { ok: false, error: "Choose a species: rat, mouse, hamster, guinea pig, or other rodent." };
  }
  if (!SEX.has(sex)) return { ok: false, error: "Sex must be female, male, or unspecified." };
  if (!DOSE.has(doseGroup)) return { ok: false, error: "Dose group is not recognized." };
  if (!STAIN.has(stain)) return { ok: false, error: "Stain is not recognized." };

  return {
    ok: true,
    value: {
      species: species as Species,
      strain: field(form, "strain", 80),
      sex: sex as Sex,
      studyId: field(form, "studyId", 80),
      animalId: field(form, "animalId", 80),
      doseGroup: doseGroup as DoseGroup,
      dose: field(form, "dose", 80),
      stain: stain as Stain,
      organ: "liver",
      filename: filename.slice(0, 180),
    },
  };
}
