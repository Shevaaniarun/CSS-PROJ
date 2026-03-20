import { PageHeader } from "../../components/PageHeader";
import { useCredentials } from "hooks/useCompany";

export function CompanyCredentials() {
  const credentialsQuery = useCredentials();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Credentials" subtitle="Track issued credentials, expiries, exports, and revocation status." />
      <div className="grid gap-4">
        {(credentialsQuery.data ?? []).map((credential) => (
          <div key={credential.id} className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{credential.worker_name ?? "Unknown worker"}</h3>
                <p className="text-sm text-black/60">{credential.external_worker_id ?? credential.worker_id}</p>
              </div>
              <div className="rounded-full bg-black/5 px-3 py-2 text-xs">
                Expires {new Date(credential.expires_at).toLocaleDateString()}
              </div>
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl bg-black/5 p-4 text-xs">
              {JSON.stringify(credential.credential_blob, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
