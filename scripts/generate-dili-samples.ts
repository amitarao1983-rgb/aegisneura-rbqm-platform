/**
 * Builds three synthetic H&E-like practice fields and checks the placeholder reader.
 * These are drawings, not slides from animals.
 *
 *   npx tsx scripts/generate-dili-samples.ts
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { predictFromFeatures } from "../src/lib/dili/predict";
import { readSlide } from "../src/lib/dili/read-slide";
import type { DiliCall, LesionCode, Specimen } from "../src/lib/dili/types";

const W = 384;
const H = 288;
const OUT = path.join(process.cwd(), "public", "dili-samples");

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function fillEosin(data: Buffer, rand: () => number) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wave = Math.sin(x * 0.17 + y * 0.07) * 0.55 + (rand() - 0.5) * 0.4;
      const offset = (y * W + x) * 3;
      data[offset] = clamp(206 + wave * 22);
      data[offset + 1] = clamp(142 + wave * 16);
      data[offset + 2] = clamp(164 + wave * 16);
    }
  }
}

function paintEllipse(
  data: Buffer,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: [number, number, number],
  rand: () => number
) {
  const x0 = Math.max(0, Math.floor(cx - rx - 1));
  const x1 = Math.min(W - 1, Math.ceil(cx + rx + 1));
  const y0 = Math.max(0, Math.floor(cy - ry - 1));
  const y1 = Math.min(H - 1, Math.ceil(cy + ry + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const offset = (y * W + x) * 3;
      data[offset] = clamp(color[0] + (rand() - 0.5) * 16);
      data[offset + 1] = clamp(color[1] + (rand() - 0.5) * 12);
      data[offset + 2] = clamp(color[2] + (rand() - 0.5) * 12);
    }
  }
}

function addNuclei(data: Buffer, rand: () => number, spacing: number) {
  for (let y = 16; y < H - 8; y += spacing) {
    for (let x = 14; x < W - 8; x += spacing) {
      paintEllipse(
        data,
        x + (rand() - 0.5) * spacing * 0.4,
        y + (rand() - 0.5) * spacing * 0.4,
        4.4,
        5.8,
        [104, 58, 156],
        rand
      );
    }
  }
}

function addVacuoles(data: Buffer, rand: () => number, count: number) {
  for (let n = 0; n < count; n++) {
    const radius = 8 + rand() * 4;
    const cx = 18 + radius + rand() * (W - 36 - radius * 2);
    const cy = 18 + radius + rand() * (H - 36 - radius * 2);
    paintEllipse(data, cx, cy, radius, radius, [247, 247, 247], rand);
  }
}

function addHemorrhage(data: Buffer, rand: () => number) {
  for (let n = 0; n < 4; n++) {
    paintEllipse(
      data,
      40 + rand() * (W - 80),
      40 + rand() * (H - 80),
      16,
      12,
      [176, 42, 48],
      rand
    );
  }
}

async function render(name: string, paint: (data: Buffer, rand: () => number) => void, seed: number) {
  const data = Buffer.alloc(W * H * 3);
  const rand = mulberry32(seed);
  fillEosin(data, rand);
  paint(data, rand);
  const png = await sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  await writeFile(path.join(OUT, name), png);
  return png;
}

const baseSpecimen = {
  species: "rat",
  strain: "Sprague-Dawley",
  sex: "female",
  studyId: "TOX-24-017",
  organ: "liver",
  stain: "he",
} as const;

async function score(name: string, png: Buffer, specimen: Specimen) {
  const features = await readSlide(png);
  const prediction = predictFromFeatures(features, specimen);
  console.log(
    name,
    prediction.call,
    "score",
    prediction.injuryScore,
    "nuclei",
    features.nuclearFraction,
    "eosin",
    features.eosinFraction,
    "vacuole",
    features.vacuoleFraction,
    "necrosisBlocks",
    features.necrosisBlockFraction,
    "inflam",
    features.inflammationBlockFraction,
    "red",
    features.saturatedRedFraction,
    "std",
    features.luminanceStd,
    "other",
    features.otherFraction
  );
  console.log(
    "  findings",
    prediction.findings.map((finding) => `${finding.code}:${finding.severity}`).join(", ") || "(none)"
  );
  return prediction;
}

function expectCall(name: string, actual: DiliCall, expected: DiliCall) {
  if (actual !== expected) throw new Error(`${name} call was ${actual}, expected ${expected}`);
}

function expectSeverity(
  name: string,
  findings: { code: LesionCode; severity: number }[],
  code: LesionCode,
  minimum: number
) {
  const severity = findings.find((finding) => finding.code === code)?.severity ?? 0;
  if (severity < minimum) throw new Error(`${name} ${code} grade was ${severity}, expected >= ${minimum}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const vehicle = await render("vehicle-control.png", (data, rand) => addNuclei(data, rand, 32), 104);
  const steatosis = await render(
    "high-dose-steatosis.png",
    (data, rand) => {
      addNuclei(data, rand, 32);
      addVacuoles(data, rand, 110);
    },
    221
  );
  const necrosis = await render(
    "high-dose-necrosis.png",
    (data, rand) => {
      addNuclei(data, rand, 96);
      addHemorrhage(data, rand);
    },
    238
  );

  const vehiclePrediction = await score("vehicle", vehicle, {
    ...baseSpecimen,
    animalId: "SD-104",
    doseGroup: "vehicle",
    dose: "0 mg/kg",
    filename: "vehicle-control.png",
  });
  const steatosisPrediction = await score("steatosis", steatosis, {
    ...baseSpecimen,
    animalId: "SD-221",
    doseGroup: "high",
    dose: "300 mg/kg",
    filename: "high-dose-steatosis.png",
  });
  const necrosisPrediction = await score("necrosis", necrosis, {
    ...baseSpecimen,
    sex: "male",
    strain: "Wistar",
    animalId: "SD-238",
    doseGroup: "high",
    dose: "300 mg/kg",
    filename: "high-dose-necrosis.png",
  });

  expectCall("vehicle", vehiclePrediction.call, "no-injury");
  expectCall("steatosis", steatosisPrediction.call, "dili-suspected");
  expectSeverity("steatosis", steatosisPrediction.findings, "steatosis", 3);
  expectCall("necrosis", necrosisPrediction.call, "dili-suspected");
  expectSeverity("necrosis", necrosisPrediction.findings, "necrosis", 3);
  console.log("practice fields ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
