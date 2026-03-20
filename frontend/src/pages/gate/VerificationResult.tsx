import { PageHeader } from "../../components/PageHeader";
import { ResultScreen } from "./components/ResultScreen";

export function GateVerificationResult() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Verification result" subtitle="Immediate green/red operator feedback with timed auto-reset." />
      <ResultScreen status="success" />
    </section>
  );
}

