import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { useParams } from "react-router-dom";
import { useStoredCredentials } from "hooks/useWorker";

export function WorkerCredentialDetail() {
  const { id } = useParams();
  const credentialsQuery = useStoredCredentials();
  const credential = (credentialsQuery.data ?? []).find((item) => item.id === id || item.credentialId === id);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credential detail" subtitle="Credential metadata, attribute set, issuer information, and local protection state." />
      <StatusBadge expiresAt={credential?.expiry} />
      <div className="panel">
        {credential ? (
          <pre className="overflow-auto rounded-2xl bg-black/5 p-4 text-xs">{JSON.stringify(credential, null, 2)}</pre>
        ) : (
          <div className="text-sm text-black/60">Credential not found in secure local storage.</div>
        )}
      </div>
    </section>
  );
}
