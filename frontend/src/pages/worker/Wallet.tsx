import { PageHeader } from "../../components/PageHeader";
import { CredentialList } from "./components/CredentialList";
import { useImportCredential, useRemoveCredential, useStoredCredentials } from "hooks/useWorker";
import { CredentialImportPanel } from "./components/CredentialImportPanel";

export function WorkerWallet() {
  const credentialsQuery = useStoredCredentials();
  const importCredential = useImportCredential();
  const removeCredential = useRemoveCredential();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credentials stored privately on device" subtitle="Workers import credentials, inspect expiry state, and prepare one-time pseudonyms without exposing their real identity to gates." />
      <CredentialImportPanel onImport={(credential) => importCredential.mutate(credential)} busy={importCredential.isPending} />
      <CredentialList credentials={credentialsQuery.data ?? []} onRemove={(credentialId) => removeCredential.mutate(credentialId)} />
    </section>
  );
}
