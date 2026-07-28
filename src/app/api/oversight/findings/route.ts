import { NextResponse } from "next/server";
import { collectAiFindings } from "@/lib/oversight";
import { readPlatform } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trialId = searchParams.get("trialId");
  const data = await readPlatform();
  let findings = collectAiFindings(data);
  if (trialId) {
    findings = findings.filter((f) => f.trialId === trialId);
  }
  return NextResponse.json({ findings });
}
