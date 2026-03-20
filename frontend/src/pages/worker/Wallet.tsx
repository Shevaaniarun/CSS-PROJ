import { PageHeader } from "../../components/PageHeader";
import { CredentialList } from "./components/CredentialList";
import { useImportCredential, useWorkerCredentials } from "hooks/useWorker";
import { CredentialImportPanel } from "./components/CredentialImportPanel";
import { toast } from "sonner";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";

export function WorkerWallet() {
  const credentialsQuery = useWorkerCredentials();
  const importCredential = useImportCredential();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Issued credentials for this worker" subtitle="Review credentials issued to your worker account, import a local copy if needed, and generate one-time pseudonyms for gates." />
      <CredentialImportPanel
        onImport={(credential) =>
          importCredential.mutate(credential, {
            onSuccess: () => toast.success(`Imported ${credential.company} credential`),
            onError: (error) => toast.error(error instanceof Error ? error.message : "Import failed")
          })
        }
        busy={importCredential.isPending}
      />
      {credentialsQuery.isLoading ? <LoadingSpinner label="Loading issued credentials..." /> : null}
      {!credentialsQuery.isLoading && (credentialsQuery.data ?? []).length === 0 ? (
        <EmptyState
          title="No credentials issued to this worker"
          description="Ask your company to issue a credential first. Once issued, it will appear here for pseudonym generation."
        />
      ) : null}
      {(credentialsQuery.data ?? []).length > 0 ? (
        <CredentialList credentials={credentialsQuery.data ?? []} />
      ) : null}
    </section>
  );
}
