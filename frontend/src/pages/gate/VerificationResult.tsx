import { PageHeader } from "../../components/PageHeader";
import { ResultScreen } from "./components/ResultScreen";
import { useAppStore } from "lib/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function GateVerificationResult() {
  const navigate = useNavigate();
  const { latestGateResult, setLatestGateResult } = useAppStore();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    setSeconds(5);
    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setLatestGateResult(null);
          navigate("/gate");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [navigate, setLatestGateResult, latestGateResult?.timestamp]);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Verification result" subtitle="Immediate green/red operator feedback with timed auto-reset." />
      <ResultScreen
        status={latestGateResult?.granted ? "success" : "failure"}
        reason={latestGateResult?.failureReason}
        checks={latestGateResult?.checks}
        countdown={seconds}
      />
    </section>
  );
}
