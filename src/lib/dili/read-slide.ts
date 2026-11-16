import sharp from "sharp";
import type { SlideFeatures } from "./types";

const ANALYZE_MAX = 384;
const BLOCK = 64;

const BACKGROUND = 0;
const NUCLEUS = 1;
const EOSIN = 2;
const RED = 3;
const PIGMENT = 4;
const COLLAGEN = 5;
const OTHER = 6;

export class SlideReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlideReadError";
  }
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Classify one RGB pixel from an H&E-style field.
 * Nuclei are dark purple or blue. Eosin is lighter pink. Glass and holes are near-white.
 */
export function classifyPixel(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sat = max === 0 ? 0 : (max - min) / max;

  if (lum < 28 && sat < 0.35) return BACKGROUND;
  if (lum > 232 && sat < 0.16) return BACKGROUND;

  const purpleNucleus =
    lum < 150 && sat > 0.18 && r > 50 && b > 70 && g < Math.min(r, b) * 0.9 && b + 10 > r;
  const blueNucleus = lum < 160 && sat > 0.15 && b > r + 12 && b > g + 12 && b > 60;
  if (purpleNucleus || blueNucleus) return NUCLEUS;

  const collagen =
    lum > 60 && lum < 210 && sat > 0.16 && b > 80 && g > 70 && b > r * 1.15 && g > r * 0.95 && g > b * 0.65;
  if (collagen) return COLLAGEN;

  const saturatedRed = lum < 210 && sat > 0.38 && r > 120 && r > g * 1.4 && r > b * 1.4;
  if (saturatedRed) return RED;

  const pigment =
    lum < 185 && sat > 0.22 && r > 90 && g > 55 && b < 95 && r > b * 1.45 && g > b * 1.15 && r - g < 90;
  if (pigment) return PIGMENT;

  const eosin = lum > 115 && lum < 225 && sat > 0.08 && sat < 0.72 && r > 135 && r > g + 18 && b > 90 && g > 70;
  if (eosin) return EOSIN;

  if (lum > 205 && sat < 0.2) return BACKGROUND;
  return OTHER;
}

function sectionStats(classes: Uint8Array, width: number, height: number): {
  vacuoleFraction: number;
  sectionFraction: number;
} {
  const count = width * height;
  const exterior = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0;
  let tail = 0;

  const push = (index: number) => {
    if (classes[index] !== BACKGROUND || exterior[index]) return;
    exterior[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(index - 1);
    if (x + 1 < width) push(index + 1);
    if (y > 0) push(index - width);
    if (y + 1 < height) push(index + width);
  }

  let vacuoles = 0;
  let section = 0;
  for (let i = 0; i < count; i++) {
    const isVacuole = classes[i] === BACKGROUND && exterior[i] === 0;
    if (isVacuole) vacuoles += 1;
    if (isVacuole || classes[i] !== BACKGROUND) section += 1;
  }

  return {
    vacuoleFraction: section === 0 ? 0 : vacuoles / section,
    sectionFraction: section / count,
  };
}

/**
 * Decode a slide image and measure stain morphology.
 * A trained model can keep this preprocess or replace it.
 */
export async function readSlide(buffer: Buffer): Promise<SlideFeatures> {
  try {
    const meta = await sharp(buffer, { failOn: "none", limitInputPixels: 40_000_000, pages: 1 }).metadata();
    const sourceWidth = meta.width ?? 0;
    const sourceHeight = meta.height ?? 0;
    if (!sourceWidth || !sourceHeight) {
      throw new SlideReadError("The file has no readable image dimensions.");
    }

    const { data, info } = await sharp(buffer, { failOn: "none", limitInputPixels: 40_000_000, pages: 1 })
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize(ANALYZE_MAX, ANALYZE_MAX, { fit: "inside", withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const pixels = width * height;
    const classes = new Uint8Array(pixels);

    for (let i = 0; i < pixels; i++) {
      const offset = i * 3;
      classes[i] = classifyPixel(data[offset], data[offset + 1], data[offset + 2]);
    }

    let tissue = 0;
    let nuclei = 0;
    let eosin = 0;
    let red = 0;
    let pigment = 0;
    let collagen = 0;
    let other = 0;
    let lumSum = 0;
    let lumSq = 0;

    for (let i = 0; i < pixels; i++) {
      const cls = classes[i];
      if (cls === BACKGROUND) continue;
      tissue += 1;
      const offset = i * 3;
      const lum = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
      lumSum += lum;
      lumSq += lum * lum;
      if (cls === NUCLEUS) nuclei += 1;
      else if (cls === EOSIN) eosin += 1;
      else if (cls === RED) red += 1;
      else if (cls === PIGMENT) pigment += 1;
      else if (cls === COLLAGEN) collagen += 1;
      else other += 1;
    }

    const { vacuoleFraction, sectionFraction } = sectionStats(classes, width, height);
    const safeTissue = Math.max(tissue, 1);
    const lumMean = tissue ? lumSum / tissue : 0;
    const lumVar = tissue ? lumSq / tissue - lumMean * lumMean : 0;

    const blocks: { nuclearDensity: number; eosinDensity: number; clearDensity: number }[] = [];

    for (let by = 0; by < height; by += BLOCK) {
      for (let bx = 0; bx < width; bx += BLOCK) {
        const y1 = Math.min(height, by + BLOCK);
        const x1 = Math.min(width, bx + BLOCK);
        let blockPixels = 0;
        let blockTissue = 0;
        let blockNuclei = 0;
        let blockEosin = 0;
        let blockClear = 0;
        for (let y = by; y < y1; y++) {
          for (let x = bx; x < x1; x++) {
            blockPixels += 1;
            const cls = classes[y * width + x];
            if (cls === BACKGROUND) {
              blockClear += 1;
              continue;
            }
            blockTissue += 1;
            if (cls === NUCLEUS) blockNuclei += 1;
            else if (cls === EOSIN) blockEosin += 1;
          }
        }
        if (blockTissue < blockPixels * 0.35) continue;
        blocks.push({
          nuclearDensity: blockNuclei / blockTissue,
          eosinDensity: blockEosin / blockTissue,
          clearDensity: blockClear / blockPixels,
        });
      }
    }

    const densities = blocks.map((block) => block.nuclearDensity).sort((a, b) => a - b);
    const medianDensity = densities.length ? densities[Math.floor(densities.length / 2)] : 0;
    const diffuseNuclearLoss = medianDensity < 0.022;
    let necrosisBlocks = 0;
    let inflammationBlocks = 0;
    let hypertrophyBlocks = 0;

    for (const block of blocks) {
      const focalNecrosis =
        block.clearDensity < 0.2 &&
        block.eosinDensity > 0.55 &&
        block.nuclearDensity < 0.03 &&
        block.nuclearDensity < medianDensity * 0.45;
      const diffuseNecrosis =
        diffuseNuclearLoss && block.clearDensity < 0.2 && block.eosinDensity > 0.5 && block.nuclearDensity < 0.03;
      if (focalNecrosis || diffuseNecrosis) necrosisBlocks += 1;
      if (block.nuclearDensity > 0.32) inflammationBlocks += 1;
      if (
        block.nuclearDensity >= 0.02 &&
        block.nuclearDensity < 0.05 &&
        block.eosinDensity > 0.55 &&
        block.clearDensity < 0.12 &&
        !diffuseNuclearLoss
      ) {
        hypertrophyBlocks += 1;
      }
    }

    const tissueBlocks = blocks.length;

    return {
      sourceWidth,
      sourceHeight,
      analyzedWidth: width,
      analyzedHeight: height,
      sectionFraction: round4(clamp01(sectionFraction)),
      nuclearFraction: round4(nuclei / safeTissue),
      eosinFraction: round4(eosin / safeTissue),
      vacuoleFraction: round4(clamp01(vacuoleFraction)),
      saturatedRedFraction: round4(red / safeTissue),
      pigmentFraction: round4(pigment / safeTissue),
      collagenFraction: round4(collagen / safeTissue),
      otherFraction: round4(other / safeTissue),
      luminanceStd: round4(Math.sqrt(Math.max(0, lumVar))),
      necrosisBlockFraction: round4(tissueBlocks ? necrosisBlocks / tissueBlocks : 0),
      inflammationBlockFraction: round4(tissueBlocks ? inflammationBlocks / tissueBlocks : 0),
      hypertrophyBlockFraction: round4(tissueBlocks ? hypertrophyBlocks / tissueBlocks : 0),
    };
  } catch (error) {
    if (error instanceof SlideReadError) throw error;
    const message = error instanceof Error ? error.message : "unreadable image";
    if (/pixel limit|exceeds pixel/i.test(message)) {
      throw new SlideReadError(
        "This image is too large to read here. Upload a microscope field or a downsampled export under about 40 megapixels. Whole-slide SVS and NDPI files are not supported in this placeholder."
      );
    }
    throw new SlideReadError(
      "Could not read this image. Use a PNG, JPEG, WEBP, or TIFF export of a liver field. Only the first page of a multi-page TIFF is read."
    );
  }
}
