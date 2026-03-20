import { PageHeader } from "../../components/PageHeader";
import { ResultScreen } from "./components/ResultScreen";
import { useAppStore } from "lib/store";

export function GateVerificationResult() {
  const { latestGateResult } = useAppStore();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Verification result" subtitle="Immediate green/red operator feedback with timed auto-reset." />
      <ResultScreen
        status={latestGateResult?.granted ? "success" : "failure"}
        reason={latestGateResult?.failureReason}
        checks={latestGateResult?.checks}
      />
    </section>
  );
}
