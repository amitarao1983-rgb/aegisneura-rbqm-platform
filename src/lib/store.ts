import { promises as fs } from "fs";
import path from "path";
import { SEED_DATA } from "./seed";
import type { PlatformData, RiskSignal, Trial, UploadedFileRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "platform.json");

/** Vercel serverless has no persistent writable disk — use in-memory demo store. */
function isServerless(): boolean {
  return process.env.VERCEL === "1";
}

let memoryStore: PlatformData | null = null;

function cloneSeed(): PlatformData {
  return JSON.parse(JSON.stringify(SEED_DATA)) as PlatformData;
}

function ensureTrialSites(t: Trial): Trial {
  if (t.sites?.length) return t;
  const ids = new Map<string, string>();
  for (const m of t.siteMetrics) ids.set(m.siteId, m.siteName);
  const sites = [...ids.entries()].map(([siteId, name], i) => ({
    siteId,
    siteNumber: String(101 + i),
    hospitalName: name.split("—")[0]?.trim() ?? name,
    city: name.split("—")[1]?.trim() ?? "TBD",
    country: "TBD",
    principalInvestigator: "TBD",
  }));
  return { ...t, sites };
}

function migratePlatform(raw: PlatformData): PlatformData {
  const trials = raw.trials.map((t) => ensureTrialSites({ ...t, sites: t.sites ?? [] }));
  return {
    ...raw,
    trials,
    riskSignals: raw.riskSignals ?? [],
  };
}

function getMemoryStore(): PlatformData {
  if (!memoryStore) memoryStore = migratePlatform(cloneSeed());
  return memoryStore;
}

async function ensureDataFile(): Promise<void> {
  if (isServerless()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), "utf-8");
  }
}

export async function readPlatform(): Promise<PlatformData> {
  if (isServerless()) return getMemoryStore();
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return migratePlatform(JSON.parse(raw) as PlatformData);
}

export async function writePlatform(data: PlatformData): Promise<void> {
  const migrated = migratePlatform(data);
  if (isServerless()) {
    memoryStore = migrated;
    return;
  }
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(migrated, null, 2), "utf-8");
}

export async function getTrial(id: string): Promise<Trial | undefined> {
  const data = await readPlatform();
  return data.trials.find((t) => t.id === id);
}

export async function updateTrial(trial: Trial): Promise<void> {
  const data = await readPlatform();
  const idx = data.trials.findIndex((t) => t.id === trial.id);
  if (idx >= 0) data.trials[idx] = trial;
  else data.trials.push(trial);
  await writePlatform(data);
}

export async function addUpload(record: UploadedFileRecord): Promise<void> {
  const data = await readPlatform();
  data.uploads.unshift(record);
  await writePlatform(data);
}

export function uploadsDir(): string {
  if (isServerless()) return path.join("/tmp", "aegisneura-uploads");
  return path.join(DATA_DIR, "uploads");
}

export function canPersistUploadBytes(): boolean {
  return !isServerless();
}

export async function addRiskSignal(signal: RiskSignal): Promise<void> {
  const data = await readPlatform();
  data.riskSignals.unshift(signal);
  await writePlatform(data);
}

export async function updateRiskSignal(
  id: string,
  patch: Partial<RiskSignal>
): Promise<RiskSignal | undefined> {
  const data = await readPlatform();
  const idx = data.riskSignals.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  data.riskSignals[idx] = { ...data.riskSignals[idx], ...patch };
  await writePlatform(data);
  return data.riskSignals[idx];
}
