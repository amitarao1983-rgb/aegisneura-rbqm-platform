import { readDiliImage } from "@/lib/dili/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const image = await readDiliImage(id);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
