"use client";

import { useEffect, useState } from "react";
import { DiliResult } from "@/components/dili/DiliResult";
import { DOSE_GROUP_OPTIONS, SEX_OPTIONS, SPECIES_OPTIONS, STAIN_OPTIONS } from "@/lib/dili/input";
import type { DiliCase, DoseGroup, Sex, Species, Stain } from "@/lib/dili/types";

type FormState = {
  species: Species;
  strain: string;
  sex: Sex;
  studyId: string;
  animalId: string;
  doseGroup: DoseGroup;
  dose: string;
  stain: Stain;
};

const EMPTY_FORM: FormState = {
  species: "rat",
  strain: "",
  sex: "unspecified",
  studyId: "",
  animalId: "",
  doseGroup: "other",
  dose: "",
  stain: "he",
};

const SAMPLES: { file: string; title: string; detail: string; form: FormState }[] = [
  {
    file: "vehicle-control.png",
    title: "Vehicle control",
    detail: "Synthetic H&E-like field, nuclei spaced through pink cytoplasm",
    form: {
      species: "rat",
      strain: "Sprague-Dawley",
      sex: "female",
      studyId: "TOX-24-017",
      animalId: "SD-104",
      doseGroup: "vehicle",
      dose: "0 mg/kg",
      stain: "he",
    },
  },
  {
    file: "high-dose-steatosis.png",
    title: "High dose, vacuolation",
    detail: "Synthetic field with clear spaces inside the section",
    form: {
      species: "rat",
      strain: "Sprague-Dawley",
      sex: "female",
      studyId: "TOX-24-017",
      animalId: "SD-221",
      doseGroup: "high",
      dose: "300 mg/kg",
      stain: "he",
    },
  },
  {
    file: "high-dose-necrosis.png",
    title: "High dose, necrosis pattern",
    detail: "Synthetic eosinophilic field with sparse nuclei",
    form: {
      species: "rat",
      strain: "Wistar",
      sex: "male",
      studyId: "TOX-24-017",
      animalId: "SD-238",
      doseGroup: "high",
      dose: "300 mg/kg",
      stain: "he",
    },
  },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

export function DiliWorkbench() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cases, setCases] = useState<DiliCase[]>([]);
  const [active, setActive] = useState<DiliCase | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dili/cases")
      .then((res) => res.json())
      .then((data: { cases?: DiliCase[] }) => {
        if (!cancelled) setCases(data.cases ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load previous reads.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function setSlide(next: File) {
    setError(null);
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(next);
    });
  }

  function acceptFile(next: File | undefined) {
    if (!next) return;
    if (!/\.(png|jpe?g|webp|tiff?)$/i.test(next.name) && !next.type.startsWith("image/")) {
      setError("Choose a PNG, JPEG, WEBP, or TIFF image.");
      return;
    }
    setSlide(next);
  }

  async function loadSample(sample: (typeof SAMPLES)[number]) {
    setError(null);
    setPreparing(true);
    try {
      const res = await fetch(`/dili-samples/${sample.file}`);
      if (!res.ok) {
        setError("That practice field is missing from the app.");
        return;
      }
      const blob = await res.blob();
      setForm(sample.form);
      setSlide(new File([blob], sample.file, { type: "image/png" }));
      setActive(null);
    } finally {
      setPreparing(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Add a liver field first.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => body.append(key, form[key]));
    setBusy(true);
    try {
      const res = await fetch("/api/dili/predict", { method: "POST", body });
      const text = await res.text();
      let json: { error?: string; case?: DiliCase };
      try {
        json = JSON.parse(text) as { error?: string; case?: DiliCase };
      } catch {
        setError("The reader failed before it could score this image.");
        return;
      }
      if (!res.ok || !json.case) {
        setError(json.error ?? "The reader could not score this image.");
        return;
      }
      setActive(json.case);
      setCases((current) => [json.case!, ...current.filter((item) => item.id !== json.case!.id)]);
    } catch {
      setError("The reader could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  async function removeActive() {
    if (!active) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/dili/cases/${active.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that read.");
        return;
      }
      setCases((current) => current.filter((item) => item.id !== active.id));
      setActive(null);
    } finally {
      setRemoving(false);
    }
  }

  const imageUrl = active ? `/api/dili/cases/${active.id}/image` : preview;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Drug-induced liver injury</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Upload a liver histopathology field from a rat or other rodent given an investigational
          drug. The reader measures the stain and returns an INHAND-style injury call for
          preclinical review, teaching, or a research hospital lab.
        </p>
      </div>

      <p className="max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        Placeholder model, not a diagnostic device. A veterinary pathologist confirms every call
        before it is used in a study report. Whole-slide SVS and NDPI files are outside this
        version. Practice images below are synthetic drawings, not slides from animals.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              acceptFile(event.dataTransfer.files?.[0]);
            }}
            className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"
          >
            <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Selected liver field" className="h-36 w-full rounded-lg object-cover" />
              ) : (
                <span className="px-4 py-8 text-sm text-slate-600">
                  Add a slide image
                  <span className="mt-1 block text-xs text-slate-500">PNG, JPEG, WEBP, or TIFF, up to 30 MB</span>
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff"
                className="sr-only"
                onChange={(event) => acceptFile(event.target.files?.[0])}
              />
              <span className="text-xs font-medium text-cyan-800">
                {file ? file.name : "Choose a file or drop it here"}
              </span>
            </label>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Practice fields</p>
            <div className="mt-2 flex flex-col gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.file}
                  type="button"
                  disabled={busy || preparing}
                  onClick={() => loadSample(sample)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-slate-800">{sample.title}</span>
                  <span className="block text-xs text-slate-500">{sample.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Species">
              <select
                className={controlClass}
                value={form.species}
                onChange={(event) => setForm({ ...form, species: event.target.value as Species })}
              >
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Strain">
              <input
                className={controlClass}
                value={form.strain}
                placeholder="Sprague-Dawley, C57BL/6…"
                onChange={(event) => setForm({ ...form, strain: event.target.value })}
              />
            </Field>
            <Field label="Sex">
              <select
                className={controlClass}
                value={form.sex}
                onChange={(event) => setForm({ ...form, sex: event.target.value as Sex })}
              >
                {SEX_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stain">
              <select
                className={controlClass}
                value={form.stain}
                onChange={(event) => setForm({ ...form, stain: event.target.value as Stain })}
              >
                {STAIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Study id">
              <input
                className={controlClass}
                value={form.studyId}
                onChange={(event) => setForm({ ...form, studyId: event.target.value })}
              />
            </Field>
            <Field label="Animal id">
              <input
                className={controlClass}
                value={form.animalId}
                onChange={(event) => setForm({ ...form, animalId: event.target.value })}
              />
            </Field>
            <Field label="Dose group">
              <select
                className={controlClass}
                value={form.doseGroup}
                onChange={(event) => setForm({ ...form, doseGroup: event.target.value as DoseGroup })}
              >
                {DOSE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dose">
              <input
                className={controlClass}
                value={form.dose}
                placeholder="300 mg/kg"
                onChange={(event) => setForm({ ...form, dose: event.target.value })}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={busy || preparing}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {busy ? "Reading stain…" : "Read slide and predict"}
          </button>
        </form>

        <div>
          {active && imageUrl ? (
            <DiliResult record={active} imageUrl={imageUrl} onRemove={removeActive} removing={removing} />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600 shadow-sm">
              The prediction appears here after a field is read. It includes the injury call, an
              INHAND-style grade, the stain fractions measured from the pixels, and the lesion
              patterns that drove the score.
              {preview && (
                <p className="mt-3 text-slate-800">Image ready. Check the animal details, then run the reader.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <h3 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Previous reads</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Species</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Call</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No reads yet.
                </td>
              </tr>
            ) : (
              cases.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-800">{item.specimen.animalId || item.specimen.filename}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.specimen.species}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.specimen.doseGroup}</td>
                  <td className="px-4 py-2.5 text-slate-800">{item.prediction.callLabel}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {item.prediction.injuryScore === null ? "—" : item.prediction.injuryScore.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setActive(item)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
