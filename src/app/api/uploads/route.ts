import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { addUpload, canPersistUploadBytes, readPlatform, uploadsDir } from "@/lib/store";

const ALLOWED = new Set([
  "application/pdf",
  "text/csv",
  "image/png",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/csv": ".csv",
  "image/png": ".png",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

export async function GET() {
  const data = await readPlatform();
  return NextResponse.json({ uploads: data.uploads });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const trialId = form.get("trialId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const nameLower = file.name.toLowerCase();
  const allowedByExt =
    nameLower.endsWith(".pdf") ||
    nameLower.endsWith(".csv") ||
    nameLower.endsWith(".png") ||
    nameLower.endsWith(".xls") ||
    nameLower.endsWith(".xlsx");

  if (!ALLOWED.has(mime) && !allowedByExt) {
    return NextResponse.json(
      { error: "Only PDF, CSV, PNG, and Excel files are allowed." },
      { status: 400 }
    );
  }

  const id = randomUUID();
  const ext = EXT[mime] ?? (path.extname(file.name) || ".bin");
  const storedName = `${id}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (canPersistUploadBytes()) {
    const dir = uploadsDir();
    await fs.mkdir(dir, { recursive: true });
    const storedPath = path.join(dir, storedName);
    await fs.writeFile(storedPath, buffer);
  }

  const record = {
    id,
    trialId: typeof trialId === "string" && trialId ? trialId : null,
    originalName: file.name,
    mimeType: mime,
    sizeBytes: buffer.length,
    storedPath: storedName,
    uploadedAt: new Date().toISOString(),
  };

  await addUpload(record);
  return NextResponse.json({ upload: record }, { status: 201 });
}
