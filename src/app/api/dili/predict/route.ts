import { randomUUID } from "crypto";
import { parseSpecimen } from "@/lib/dili/input";
import { predictFromFeatures } from "@/lib/dili/predict";
import { SlideReadError, readSlide } from "@/lib/dili/read-slide";
import { saveDiliCase } from "@/lib/dili/store";
import type { DiliCase } from "@/lib/dili/types";

export const runtime = "nodejs";

const MAX_BYTES = 30 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

function mimeFor(file: File): string | null {
  const ext = file.name.toLowerCase().match(/\.(png|jpe?g|webp|tiff?)$/)?.[0] ?? "";
  const fromExt = EXT_MIME[ext.startsWith(".") ? ext : ""];
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp" || type === "image/tiff") {
    return type;
  }
  if (type === "image/jpg") return "image/jpeg";
  if (type === "image/tif" || type === "image/x-tiff") return "image/tiff";
  return fromExt ?? null;
}

function safeName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "slide";
  return base.replace(/[^\w.\- ()+,]/g, "_").slice(0, 180);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Upload the slide as form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Add a histopathology image before predicting." }, { status: 400 });
  }

  const mimeType = mimeFor(file);
  if (!mimeType) {
    return Response.json(
      { error: "Use a PNG, JPEG, WEBP, or TIFF image. Whole-slide SVS and NDPI files are not supported in this placeholder." },
      { status: 400 }
    );
  }
  if (file.size <= 0) {
    return Response.json({ error: "The image file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Images must be 30 MB or smaller. Export a field rather than a whole slide." }, { status: 400 });
  }

  const filename = safeName(file.name);
  const specimen = parseSpecimen(form, filename);
  if (!specimen.ok) return Response.json({ error: specimen.error }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let features;
    try {
      features = await readSlide(buffer);
    } catch (error) {
      const message = error instanceof SlideReadError ? error.message : "Could not read this image.";
      return Response.json({ error: message }, { status: 400 });
    }

    const prediction = predictFromFeatures(features, specimen.value);
    const record: DiliCase = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      specimen: specimen.value,
      image: {
        mimeType,
        sizeBytes: buffer.length,
        width: features.sourceWidth,
        height: features.sourceHeight,
      },
      prediction,
    };

    await saveDiliCase(record, buffer, mimeType);
    return Response.json({ case: record }, { status: 201 });
  } catch (error) {
    console.error("DILI predict failed", error);
    return Response.json({ error: "The reader could not finish this image." }, { status: 500 });
  }
}
