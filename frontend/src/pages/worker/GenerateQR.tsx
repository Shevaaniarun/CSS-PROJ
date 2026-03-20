import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PageHeader } from "../../components/PageHeader";
import { useGeneratePseudonym, useWorkerCredentials, WorkerCredentialRecord } from "hooks/useWorker";
import { useAppStore } from "lib/store";

function getCredentialKeys(credential: WorkerCredentialRecord): string[] {
  const effective = credential.credential_blob.effective_crypto_attributes;
  if (Array.isArray(effective)) {
    return effective.filter((item): item is string => typeof item === "string");
  }
  const fallback = ["company", "role", "campus_access"].filter(
    (key) => typeof credential.credential_blob[key] === "string"
  );
  return fallback.length > 0 ? fallback : ["company", "role"];
}

function buildAccessTree(attributeKeys: string[]) {
  return {
    type: "AND",
    children: attributeKeys.map((attribute) => ({
      type: "leaf",
      attribute
    }))
  };
}

function buildOwnAttributes(credential: WorkerCredentialRecord, attributeKeys: string[]) {
  return attributeKeys
    .map((key) => {
      const value = credential.credential_blob[key];
      return typeof value === "string" ? `${key}:${value}` : null;
    })
    .filter((item): item is string => Boolean(item));
}

export function WorkerGenerateQR() {
  const navigate = useNavigate();
  const credentialsQuery = useWorkerCredentials();
  const generatePseudonym = useGeneratePseudonym();
  const { setLatestQr } = useAppStore();
  const [gateNonce, setGateNonce] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const credentials = credentialsQuery.data ?? [];
  const selectedCredential = useMemo(
    () => credentials.find((credential) => credential.id === credentialId),
    [credentialId, credentials]
  );
  const attributeKeys = useMemo(
    () => (selectedCredential ? getCredentialKeys(selectedCredential) : []),
    [selectedCredential]
  );
  const accessTree = useMemo(
    () => (selectedCredential ? buildAccessTree(attributeKeys) : null),
    [attributeKeys, selectedCredential]
  );

  useEffect(() => {
    if (!credentialId && credentials.length > 0) {
      setCredentialId(credentials[0].id);
    }
  }, [credentialId, credentials]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCredential) {
      setError("Select an issued credential first.");
      return;
    }
    if (!gateNonce.trim()) {
      setError("Paste the nonce shown on the gate before generating the QR.");
      return;
    }
    if (!accessTree) {
      setError("Could not prepare the disclosure policy for this credential.");
      return;
    }

    try {
      const ownAttributes = buildOwnAttributes(selectedCredential, attributeKeys);
      const payload = await generatePseudonym.mutateAsync({
        credential_id: selectedCredential.id,
        gate_nonce: gateNonce.trim(),
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
      toast.success("QR generated successfully");
      navigate("/worker/qr-display");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not generate pseudonym";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Worker Wallet"
        title="Generate gate QR"
        subtitle="Choose one of your issued credentials, paste the gate nonce, and generate a live QR. The disclosure policy is built automatically."
      />
      {credentialsQuery.isLoading ? <LoadingSpinner label="Loading issued credentials..." /> : null}
      {!credentialsQuery.isLoading && credentials.length === 0 ? (
        <EmptyState
          title="No issued credential available"
          description="Your company needs to issue a credential to this worker account before you can generate a gate pseudonym."
        />
      ) : null}
      {credentials.length > 0 ? (
        <form className="panel grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm">
            <span className="text-white/80">Active gate nonce</span>
            <input
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder="Paste the nonce shown on the gate"
              value={gateNonce}
              onChange={(event) => setGateNonce(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-white/80">Issued credential</span>
            <select
              className="rounded-2xl border border-black/10 px-4 py-3"
              value={credentialId}
              onChange={(event) => setCredentialId(event.target.value)}
            >
              <option value="">Select issued credential</option>
              {credentials.map((credential) => (
                <option key={credential.id} value={credential.id}>
                  {String(credential.credential_blob.company ?? credential.company_name ?? "Credential")} | {credential.id}
                </option>
              ))}
            </select>
          </label>
          {selectedCredential ? (
            <div className="rounded-2xl bg-black/5 p-4 text-sm text-white/80">
              <div className="font-medium text-white">
                {String(selectedCredential.credential_blob.company ?? selectedCredential.company_name ?? "Credential")}
              </div>
              <div className="mt-1">Role: {String(selectedCredential.credential_blob.role ?? "delivery")}</div>
              <div className="mt-1">Expires: {new Date(selectedCredential.expires_at).toLocaleString()}</div>
              <div className="mt-3">
                Attributes used for the pseudonym: {attributeKeys.length > 0 ? attributeKeys.join(", ") : "none"}
              </div>
            </div>
          ) : null}
          {error ? <div className="text-sm text-ember">{error}</div> : null}
          <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white" disabled={generatePseudonym.isPending}>
            {generatePseudonym.isPending ? "Generating..." : "Generate live QR"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
