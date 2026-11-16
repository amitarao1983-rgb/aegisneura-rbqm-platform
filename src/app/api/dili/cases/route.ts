import { listDiliCases } from "@/lib/dili/store";

export const runtime = "nodejs";

export async function GET() {
  const cases = await listDiliCases();
  return Response.json({ cases });
}
