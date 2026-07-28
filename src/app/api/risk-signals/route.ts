import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { siteDisplayName } from "@/lib/oversight";
import { addRiskSignal, readPlatform, updateRiskSignal } from "@/lib/store";
import type { AiRiskFactor, OversightRole, RiskSignalPriority } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trialId = searchParams.get("trialId");
  const siteId = searchParams.get("siteId");
  const data = await readPlatform();
  let signals = data.riskSignals;
  if (trialId) signals = signals.filter((s) => s.trialId === trialId);
  if (siteId) signals = signals.filter((s) => s.siteId === siteId);
  return NextResponse.json({ riskSignals: signals });
}

type CreateBody = {
  trialId: string;
  siteId: string;
  raisedByRole: OversightRole;
  raisedByName: string;
  title: string;
  queryText: string;
  riskFactors: AiRiskFactor[];
  priority?: RiskSignalPriority;
  sendNow?: boolean;
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateBody;
  const data = await readPlatform();
  const trial = data.trials.find((t) => t.id === body.trialId);
  if (!trial) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }
  const siteOk =
    trial.sites.some((s) => s.siteId === body.siteId) ||
    trial.siteMetrics.some((m) => m.siteId === body.siteId);
  if (!siteOk) {
    return NextResponse.json({ error: "Site not found on trial" }, { status: 400 });
  }
  if (!body.title?.trim() || !body.queryText?.trim()) {
    return NextResponse.json({ error: "title and queryText required" }, { status: 400 });
  }

  const sendNow = body.sendNow === true;
  const signal = {
    id: randomUUID(),
    trialId: trial.id,
    protocolId: trial.protocolId,
    siteId: body.siteId,
    siteName: siteDisplayName(trial, body.siteId),
    raisedByRole: body.raisedByRole,
    raisedByName: body.raisedByName,
    title: body.title.trim(),
    queryText: body.queryText.trim(),
    riskFactors: body.riskFactors ?? [],
    priority: body.priority ?? "routine",
    status: sendNow ? ("sent" as const) : ("draft" as const),
    createdAt: new Date().toISOString(),
    sentAt: sendNow ? new Date().toISOString() : null,
  };
  await addRiskSignal(signal);
  return NextResponse.json({ riskSignal: signal }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id: string;
    action?: "send" | "acknowledge" | "close";
    status?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const data = await readPlatform();
  const existing = data.riskSignals.find((s) => s.id === body.id);
  if (!existing) {
    return NextResponse.json({ error: "Risk signal not found" }, { status: 404 });
  }

  let patch: Parameters<typeof updateRiskSignal>[1] = {};
  if (body.action === "send") {
    patch = { status: "sent", sentAt: new Date().toISOString() };
  } else if (body.action === "acknowledge") {
    patch = { status: "acknowledged" };
  } else if (body.action === "close") {
    patch = { status: "closed" };
  }

  const updated = await updateRiskSignal(body.id, patch);
  return NextResponse.json({ riskSignal: updated });
}
