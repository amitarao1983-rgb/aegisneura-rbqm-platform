"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Trial, UploadedFileRecord } from "@/lib/types";

export function UploadPanel({
  trials,
  uploads,
}: {
  trials: Trial[];
  uploads: UploadedFileRecord[];
}) {
  const router = useRouter();
  const [trialId, setTrialId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.[0]) {
      setError("Choose a file to upload.");
      return;
    }
    const body = new FormData();
    body.append("file", input.files[0]);
    if (trialId) body.append("trialId", trialId);
    setBusy(true);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Upload failed");
      else {
        form.reset();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Document intake</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Upload supporting evidence: monitoring reports (PDF), exports (CSV), screenshots (PNG),
          or Excel workbooks. Files are stored for downstream parsing connectors (placeholders).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="block text-sm text-slate-700">
          Link to trial (optional)
          <select
            value={trialId}
            onChange={(e) => setTrialId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">— None —</option>
            {trials.map((t) => (
              <option key={t.id} value={t.id}>
                {t.protocolId} — {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          File (PDF, CSV, PNG, Excel)
          <input
            name="file"
            type="file"
            accept=".pdf,.csv,.png,.xls,.xlsx,application/pdf,text/csv,image/png"
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-cyan-100 file:px-3 file:py-1.5 file:text-cyan-800"
          />
        </label>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Trial</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {uploads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No uploads yet — use the form above.
                </td>
              </tr>
            ) : (
              uploads.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800">{u.originalName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.trialId ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {(u.sizeBytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {new Date(u.uploadedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
