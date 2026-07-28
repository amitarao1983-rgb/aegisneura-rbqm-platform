import { OversightWorkbench } from "@/components/OversightWorkbench";
import { collectAiFindings } from "@/lib/oversight";
import { readPlatform } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ trial?: string }> };

export default async function OversightPage({ searchParams }: Props) {
  const { trial: initialTrialId } = await searchParams;
  const data = await readPlatform();
  const findings = collectAiFindings(data);

  return (
    <OversightWorkbench
      trials={data.trials}
      findings={findings}
      riskSignals={data.riskSignals}
      initialTrialId={initialTrialId}
    />
  );
}
