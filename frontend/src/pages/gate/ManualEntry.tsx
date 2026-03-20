import { PageHeader } from "../../components/PageHeader";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGateVerify } from "hooks/useGate";
import { useAppStore } from "lib/store";
import { toast } from "sonner";

export function GateManualEntry() {
  const navigate = useNavigate();
  const gateVerify = useGateVerify();
  const { gateId, latestGateResult, setLatestGateResult } = useAppStore();
  const [gateNonce, setGateNonce] = useState(localStorage.getItem("gate:last-nonce") ?? "");
  const [pu, setPu] = useState("");
  const [paJson, setPaJson] = useState("{}");
  const [z, setZ] = useState("");
  const [signatureJson, setSignatureJson] = useState("{}");
  const [accessTreeJson, setAccessTreeJson] = useState("{}");
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const qr_data = {
        pseudonym: {
          pu,
          pa: JSON.parse(paJson) as Record<string, unknown>,
          z
        },
        signature: JSON.parse(signatureJson) as Record<string, unknown>,
        access_tree: JSON.parse(accessTreeJson) as Record<string, unknown>,
        message: {
          nonce: gateNonce,
          timestamp
        },
        nonce: gateNonce
      };
      const response = await gateVerify.mutateAsync({
        gate_id: gateId,
        gate_nonce: gateNonce,
        received_nonce: gateNonce,
        timestamp,
        qr_data
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
      if (response.granted) {
        toast.success("Manual verification granted");
      } else {
        toast.error(response.failure_reason ?? "Manual verification failed");
      }
      navigate("/gate/result");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Manual verification failed");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Manual override" subtitle="Fallback path for camera failure, with override note capture and audit logging." />
      <form className="panel grid gap-4" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Gate nonce"
          value={gateNonce}
          onChange={(event) => setGateNonce(event.target.value)}
        />
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Pseudonym pu"
          value={pu}
          onChange={(event) => setPu(event.target.value)}
        />
        <textarea
          className="rounded-2xl border border-black/10 px-4 py-3"
          rows={4}
          placeholder="Pseudonym pa JSON"
          value={paJson}
          onChange={(event) => setPaJson(event.target.value)}
        />
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="z"
          value={z}
          onChange={(event) => setZ(event.target.value)}
        />
        <textarea
          className="rounded-2xl border border-black/10 px-4 py-3"
          rows={4}
          placeholder="Signature JSON"
          value={signatureJson}
          onChange={(event) => setSignatureJson(event.target.value)}
        />
        <textarea
          className="rounded-2xl border border-black/10 px-4 py-3"
          rows={4}
          placeholder="Access tree JSON"
          value={accessTreeJson}
          onChange={(event) => setAccessTreeJson(event.target.value)}
        />
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          type="datetime-local"
          value={timestamp.slice(0, 16)}
          onChange={(event) => setTimestamp(new Date(event.target.value).toISOString())}
        />
        <button className="rounded-2xl bg-ember px-4 py-3 text-sm text-white">
          Submit manual verification
        </button>
      </form>
      {latestGateResult ? (
        <div className="panel text-sm text-black/60">
          Last manual verification: {latestGateResult.granted ? "granted" : `denied (${latestGateResult.failureReason ?? "unknown"})`}
        </div>
      ) : null}
    </section>
  );
}
