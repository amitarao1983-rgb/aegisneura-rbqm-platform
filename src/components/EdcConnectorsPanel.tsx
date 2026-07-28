"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EdcConnector } from "@/lib/types";

export function EdcConnectorsPanel({ connectors }: { connectors: EdcConnector[] }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function sync(connectorId: string) {
    setSyncing(connectorId);
    setMessage(null);
    try {
      const res = await fetch("/api/edc/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId }),
      });
      const json = await res.json();
      if (!res.ok) setMessage(json.error ?? "Sync failed");
      else setMessage(json.message ?? "Sync complete");
      router.refresh();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">EDC connectors</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Configure electronic data capture integrations for unattended pulls into AegisNeura. Sync
          refreshes site KRIs and study QTL numerators without manual data entry.
        </p>
      </div>
      {message && (
        <p className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-900">
          {message}
        </p>
      )}
      <div className="grid gap-4">
        {connectors.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 font-mono text-xs text-slate-500">{c.baseUrl}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Vendor: {c.vendor.replace(/_/g, " ")} · API key {c.apiKeyPlaceholder} · every{" "}
                  {c.syncCronMinutes} min (scheduled job placeholder)
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Trials: {c.trialIds.length ? c.trialIds.join(", ") : "none mapped"}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${c.enabled ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600"}`}
              >
                {c.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-600">{c.lastSyncMessage}</p>
            {c.lastSyncAt && (
              <p className="text-[11px] text-slate-500">
                Last sync: {new Date(c.lastSyncAt).toLocaleString()} ({c.lastSyncStatus})
              </p>
            )}
            <button
              type="button"
              disabled={!c.enabled || syncing === c.id}
              onClick={() => sync(c.id)}
              className="mt-4 rounded-lg border border-cyan-600 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-40"
            >
              {syncing === c.id ? "Pulling EDC…" : "Run automated EDC sync now"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
