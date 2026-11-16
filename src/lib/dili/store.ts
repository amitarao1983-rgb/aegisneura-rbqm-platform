import { promises as fs } from "fs";
import path from "path";
import type { DiliCase } from "./types";

const DIR = path.join(process.cwd(), "data", "dili");
const CASES_FILE = path.join(DIR, "cases.json");
const SLIDES_DIR = path.join(DIR, "slides");

type StoredImage = { buffer: Buffer; mimeType: string };

const memoryCases: DiliCase[] = [];
const memoryImages = new Map<string, StoredImage>();

let queue: Promise<unknown> = Promise.resolve();

function isServerless(): boolean {
  return process.env.VERCEL === "1";
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function ensureDirs(): Promise<void> {
  if (isServerless()) return;
  await fs.mkdir(SLIDES_DIR, { recursive: true });
}

export function slideExtension(mimeType: string): string {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/tiff") return ".tif";
  return ".jpg";
}

export async function listDiliCases(): Promise<DiliCase[]> {
  return enqueue(async () => {
    const cases = await readCases();
    return cases
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 50);
  });
}

export async function getDiliCase(id: string): Promise<DiliCase | undefined> {
  return enqueue(async () => {
    const cases = await readCases();
    return cases.find((item) => item.id === id);
  });
}

export async function saveDiliCase(record: DiliCase, image: Buffer, mimeType: string): Promise<void> {
  await enqueue(async () => {
    if (isServerless()) {
      memoryCases.push(record);
      memoryImages.set(record.id, { buffer: image, mimeType });
      return;
    }
    await ensureDirs();
    const cases = await readCases();
    cases.push(record);
    const ext = slideExtension(mimeType);
    await fs.writeFile(path.join(SLIDES_DIR, `${record.id}${ext}`), image);
    const tmp = `${CASES_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(cases, null, 2), "utf-8");
    await fs.rm(CASES_FILE, { force: true });
    await fs.rename(tmp, CASES_FILE);
  });
}

export async function deleteDiliCase(id: string): Promise<boolean> {
  return enqueue(async () => {
    if (isServerless()) {
      const index = memoryCases.findIndex((item) => item.id === id);
      if (index < 0) return false;
      memoryCases.splice(index, 1);
      memoryImages.delete(id);
      return true;
    }
    const cases = await readCases();
    const next = cases.filter((item) => item.id !== id);
    if (next.length === cases.length) return false;
    await ensureDirs();
    await fs.writeFile(CASES_FILE, JSON.stringify(next, null, 2), "utf-8");
    for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]) {
      await fs.rm(path.join(SLIDES_DIR, `${id}${ext}`), { force: true });
    }
    return true;
  });
}

export async function readDiliImage(id: string): Promise<StoredImage | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  if (isServerless()) return memoryImages.get(id);
  await ensureDirs();
  for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]) {
    const filePath = path.join(SLIDES_DIR, `${id}${ext}`);
    try {
      const buffer = await fs.readFile(filePath);
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".tif" || ext === ".tiff"
              ? "image/tiff"
              : "image/jpeg";
      return { buffer, mimeType };
    } catch {
      // try the next extension
    }
  }
  return undefined;
}

async function readCases(): Promise<DiliCase[]> {
  if (isServerless()) return memoryCases;
  try {
    const raw = await fs.readFile(CASES_FILE, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw) as DiliCase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
