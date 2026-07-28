import { NextResponse } from "next/server";
import { runTrialAnalysis } from "@/lib/risk-engine";
import { getTrial } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const trial = await getTrial(id);
  if (!trial) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }
  const analysis = runTrialAnalysis(trial);
  return NextResponse.json({ trial, analysis });
}
