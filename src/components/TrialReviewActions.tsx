"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrialReviewActions({ trialId }: { trialId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function runReview() {
    setBusy(true);
    try {
      await fetch(`/api/trials/${trialId}/analyze`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={runReview}
      disabled={busy}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50"
    >
      {busy ? "Running automated review…" : "Re-run automated statistical review"}
    </button>
  );
}
