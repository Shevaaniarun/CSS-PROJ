import { PageHeader } from "../../components/PageHeader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CameraView } from "./components/CameraView";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useGateNonce, useGateStatus, useGateSync, useGateVerify } from "hooks/useGate";
import { useAppStore } from "lib/store";

export function GateScanner() {
  const navigate = useNavigate();
  const { gateId, setGateId, setLatestGateResult } = useAppStore();
  const gateStatus = useGateStatus();
  const gateNonce = useGateNonce();
  const gateVerify = useGateVerify();
  const gateSync = useGateSync();
  const [qrText, setQrText] = useState("");
  const [verificationSummary, setVerificationSummary] = useState<string | null>(null);
  const [cachedNonce, setCachedNonce] = useState<string | null>(localStorage.getItem("gate:last-nonce"));

  useEffect(() => {
    if (gateStatus.data?.id && gateStatus.data.id !== gateId) {
      setGateId(gateStatus.data.id);
    }
  }, [gateId, gateStatus.data?.id, setGateId]);

  async function handleIssueNonce() {
    if (!gateId) {
      return;
    }
    const response = await gateNonce.mutateAsync(gateId);
    localStorage.setItem("gate:last-nonce", response.nonce);
    setCachedNonce(response.nonce);
  }

  async function handleVerify() {
    if (!gateId || !cachedNonce || !qrText.trim()) {
      setVerificationSummary("Provide a gate id, active nonce, and scanned QR payload.");
      return;
    }
    try {
      const qrData = JSON.parse(qrText) as Record<string, unknown>;
      const response = await gateVerify.mutateAsync({
        gate_id: gateId,
        gate_nonce: cachedNonce,
        received_nonce: String(qrData.nonce ?? ""),
        timestamp: new Date().toISOString(),
        qr_data: qrData
      });
      setLatestGateResult({
        granted: response.granted,
        failureReason: response.failure_reason,
        timestamp: new Date().toISOString(),
        checks: {
          signature_verified: response.signature_verified,
          expiry_check_passed: response.expiry_check_passed,
          timestamp_check_passed: response.timestamp_check_passed,
          nonce_check_passed: response.nonce_check_passed,
          trust_check_passed: response.trust_check_passed,
          revocation_check_passed: response.revocation_check_passed,
          replay_check_passed: response.replay_check_passed
        }
      });
      setVerificationSummary(response.granted ? "Access granted" : `Access denied: ${response.failure_reason ?? "unknown reason"}`);
      if (response.granted) {
        toast.success("Access granted");
      } else {
        toast.error(response.failure_reason ?? "Access denied");
      }
      navigate("/gate/result");
    } catch {
      setVerificationSummary("QR payload must be valid JSON.");
      toast.error("QR payload must be valid JSON");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Scan one-time worker pseudonyms" subtitle="The kiosk performs signature, expiry, nonce, trust, revocation, and replay checks in sequence." />
      {gateStatus.isLoading ? <LoadingSpinner label="Loading gate session..." /> : null}
      {gateStatus.isError ? (
        <EmptyState
          title="Gate session unavailable"
          description="Sign in as an approved gate to fetch its kiosk identity and begin issuing nonces."
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <OfflineIndicator online={navigator.onLine} hasCachedNonce={Boolean(cachedNonce)} />
        <input
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          placeholder="Gate ID"
          value={gateStatus.data?.id ?? gateId}
          disabled
          readOnly
        />
        <button className="rounded-full bg-moss px-4 py-2 text-sm text-white" disabled={!gateId} onClick={() => void handleIssueNonce()}>
          Get nonce
        </button>
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-white" disabled={!gateId} onClick={() => gateSync.mutate(gateId)}>
          Sync trust cache
        </button>
        <div className="text-sm text-white/70">
          {gateStatus.data ? `${gateStatus.data.name} (${gateStatus.data.location})` : "No gate profile loaded"} | Status: {gateStatus.data?.status ?? "unknown"} | Nonce: {cachedNonce ?? "not issued"}
        </div>
      </div>
      <CameraView qrText={qrText} onQrTextChange={setQrText} onVerify={() => void handleVerify()} busy={gateVerify.isPending} />
      {verificationSummary ? <div className="panel text-sm">{verificationSummary}</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Gate flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Check gate status and sync trusted company keys.</li>
            <li>2. Generate a short-lived nonce for the worker.</li>
            <li>3. Scan the live QR produced by the worker.</li>
            <li>4. Run the 7-step verification pipeline.</li>
            <li>5. Grant or deny access and record the attempt.</li>
          </ol>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Verification steps</h3>
          <div className="mt-4 grid gap-2 text-sm text-black/70">
            <div>Signature verification</div>
            <div>Credential expiry check</div>
            <div>Timestamp freshness window</div>
            <div>Nonce match and expiry</div>
            <div>Trusted company check</div>
            <div>Revocation list check</div>
            <div>Pseudonym replay check</div>
          </div>
        </div>
      </div>
    </section>
  );
}
