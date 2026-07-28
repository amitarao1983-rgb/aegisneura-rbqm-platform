import { NextResponse } from "next/server";
import { perturbMetrics } from "@/lib/risk-engine";
import { readPlatform, writePlatform } from "@/lib/store";

export async function GET() {
  const data = await readPlatform();
  return NextResponse.json({ connectors: data.connectors });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { connectorId?: string };
  const connectorId = body.connectorId;
  if (!connectorId) {
    return NextResponse.json({ error: "connectorId required" }, { status: 400 });
  }

  const data = await readPlatform();
  const connector = data.connectors.find((c) => c.id === connectorId);
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }
  if (!connector.enabled) {
    return NextResponse.json({ error: "Connector is disabled" }, { status: 400 });
  }

  const linked = data.trials.filter((t) => connector.trialIds.includes(t.id));
  if (linked.length === 0) {
    connector.lastSyncStatus = "error";
    connector.lastSyncMessage = "No trials mapped to this connector.";
    connector.lastSyncAt = new Date().toISOString();
    await writePlatform(data);
    return NextResponse.json({ connector, syncedTrials: 0 });
  }

  for (const trial of linked) {
    if (trial.siteMetrics.length > 0) {
      trial.siteMetrics = perturbMetrics(trial.siteMetrics);
    }
    trial.qtls = trial.qtls.map((q) => {
      if (q.observedDenominator === 0) return q;
      const delta = Math.floor(Math.random() * 3) - 1;
      const num = Math.max(0, q.observedNumerator + delta);
      return { ...q, observedNumerator: num };
    });
    trial.lastAutomatedReviewAt = new Date().toISOString();
  }

  connector.lastSyncStatus = "success";
  connector.lastSyncAt = new Date().toISOString();
  connector.lastSyncMessage = `Automated EDC pull completed for ${linked.length} trial(s). Metrics refreshed without manual review.`;

  await writePlatform(data);
  return NextResponse.json({
    connector,
    syncedTrials: linked.length,
    message: connector.lastSyncMessage,
  });
}
