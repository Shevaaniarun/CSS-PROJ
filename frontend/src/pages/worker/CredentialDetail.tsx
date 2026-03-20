import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useWorkerCredentials } from "hooks/useWorker";

export function WorkerCredentialDetail() {
  const { id } = useParams();
  const credentialsQuery = useWorkerCredentials();
  const credential = (credentialsQuery.data ?? []).find((item) => item.id === id);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credential detail" subtitle="Credential metadata, attribute set, issuer information, and local protection state." />
      {credentialsQuery.isLoading ? <LoadingSpinner label="Loading credential detail..." /> : null}
      <StatusBadge expiresAt={credential?.expires_at} />
      <div className="panel">
        {credential ? (
          <pre className="overflow-auto rounded-2xl bg-black/5 p-4 text-xs">{JSON.stringify(credential, null, 2)}</pre>
        ) : (
          <EmptyState title="Credential not found" description="This credential is not issued to the currently signed-in worker." />
        )}
      </div>
    </section>
  );
}
