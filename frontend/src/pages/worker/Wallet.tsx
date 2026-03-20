import { PageHeader } from "../../components/PageHeader";
import { CredentialList } from "./components/CredentialList";
import { FormEvent, useState } from "react";
import { useImportCredential, useRemoveCredential, useStoredCredentials } from "hooks/useWorker";

export function WorkerWallet() {
  const credentialsQuery = useStoredCredentials();
  const importCredential = useImportCredential();
  const removeCredential = useRemoveCredential();
  const [credentialText, setCredentialText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed = JSON.parse(credentialText) as Record<string, unknown>;
      const credentialId = String(parsed.credential_id ?? parsed.worker_id ?? crypto.randomUUID());
      importCredential.mutate({
        id: credentialId,
        credentialId,
        company: String(parsed.company ?? "Unknown company"),
        role: String(parsed.role ?? "delivery"),
        expiry: String(parsed.expiry ?? new Date().toISOString()),
        importedAt: new Date().toISOString(),
        blob: parsed
      });
      setCredentialText("");
      setError(null);
    } catch {
      setError("Credential JSON is invalid.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credentials stored privately on device" subtitle="Workers import credentials, inspect expiry state, and prepare one-time pseudonyms without exposing their real identity to gates." />
      <form className="panel space-y-4" onSubmit={handleImport}>
        <h3 className="text-lg font-semibold">Import credential bundle</h3>
        <textarea
          className="min-h-44 w-full rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Paste credential JSON from company onboarding"
          value={credentialText}
          onChange={(event) => setCredentialText(event.target.value)}
        />
        {error ? <div className="text-sm text-ember">{error}</div> : null}
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white" disabled={importCredential.isPending}>
          {importCredential.isPending ? "Importing..." : "Import credential"}
        </button>
      </form>
      <CredentialList credentials={credentialsQuery.data ?? []} onRemove={(credentialId) => removeCredential.mutate(credentialId)} />
    </section>
  );
}
