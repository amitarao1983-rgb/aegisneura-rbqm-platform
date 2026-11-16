import { deleteDiliCase, getDiliCase } from "@/lib/dili/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const record = await getDiliCase(id);
  if (!record) return Response.json({ error: "Read not found." }, { status: 404 });
  return Response.json({ case: record });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const removed = await deleteDiliCase(id);
  if (!removed) return Response.json({ error: "Read not found." }, { status: 404 });
  return Response.json({ ok: true });
}
