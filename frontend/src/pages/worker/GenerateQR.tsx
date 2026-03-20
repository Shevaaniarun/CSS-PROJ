import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { useGeneratePseudonym, useStoredCredentials } from "hooks/useWorker";
import { useAppStore } from "lib/store";

export function WorkerGenerateQR() {
  const credentialsQuery = useStoredCredentials();
  const generatePseudonym = useGeneratePseudonym();
  const { setLatestQr } = useAppStore();
  const [gateNonce, setGateNonce] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [policyText, setPolicyText] = useState(
    "{\"type\":\"AND\",\"children\":[{\"type\":\"leaf\",\"attribute\":\"company:Amazon\"},{\"type\":\"leaf\",\"attribute\":\"role:delivery\"}]}"
  );
  const selectedCredential = useMemo(
    () =>
      (credentialsQuery.data ?? []).find(
        (credential) => credential.credentialId === credentialId || credential.id === credentialId
      ),
    [credentialId, credentialsQuery.data]
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCredential) {
      setError("Select or import a credential first.");
      return;
    }
    try {
      const accessTree = JSON.parse(policyText) as Record<string, unknown>;
      const ownAttributes = Object.entries(selectedCredential.blob)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => `${key}:${String(value)}`);
      const payload = await generatePseudonym.mutateAsync({
        credential_id: selectedCredential.credentialId,
        gate_nonce: gateNonce,
        own_attributes: ownAttributes,
        delegated_attributes: {},
        simulated_attributes: {},
        access_tree: accessTree,
        message: {
          screen: "worker-wallet",
          generated_at: new Date().toISOString()
        }
      });
      setLatestQr({
        payload,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString()
      });
      setError(null);
    } catch {
      setError("Could not generate pseudonym. Check nonce, credential id, and policy JSON.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Worker Wallet"
        title="Generate gate QR"
        subtitle="Generate a one-time pseudonym with a five-minute lifetime for the current campus entry attempt."
      />
      <form className="panel grid gap-4" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Paste gate nonce"
          value={gateNonce}
          onChange={(event) => setGateNonce(event.target.value)}
        />
        <select
          className="rounded-2xl border border-black/10 px-4 py-3"
          value={credentialId}
          onChange={(event) => setCredentialId(event.target.value)}
        >
          <option value="">Select imported credential</option>
          {(credentialsQuery.data ?? []).map((credential) => (
            <option key={credential.id} value={credential.credentialId}>
              {credential.company} | {credential.credentialId}
            </option>
          ))}
        </select>
        <textarea
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Access tree / attribute disclosure policy"
          rows={5}
          value={policyText}
          onChange={(event) => setPolicyText(event.target.value)}
        />
        {error ? <div className="text-sm text-ember">{error}</div> : null}
        {generatePseudonym.isSuccess ? (
          <div className="text-sm text-moss">Pseudonym generated. Open the QR display page to present it to the gate.</div>
        ) : null}
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white" disabled={generatePseudonym.isPending}>
          {generatePseudonym.isPending ? "Generating..." : "Generate live QR"}
        </button>
      </form>
    </section>
  );
}
