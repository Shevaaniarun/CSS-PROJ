import { PageHeader } from "../../components/PageHeader";
import { useCredentials } from "hooks/useCompany";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { CredentialQRModal } from "./components/CredentialQRModal";

function buildCredentialExport(credential: {
  id: string;
  worker_id: string;
  worker_name: string | null;
  external_worker_id: string | null;
  expires_at: string;
  created_at: string;
  credential_blob: Record<string, unknown>;
}) {
  return {
    id: credential.id,
    credential_id: credential.id,
    worker_id: credential.worker_id,
    worker_name: credential.worker_name,
    external_worker_id: credential.external_worker_id,
    expires_at: credential.expires_at,
    created_at: credential.created_at,
    credential_blob: credential.credential_blob,
    credential: credential.credential_blob
  };
}

export function CompanyCredentials() {
  const credentialsQuery = useCredentials();
  const [selectedQr, setSelectedQr] = useState<{ title: string; value: string } | null>(null);

  function downloadCredential(credential: {
    id: string;
    worker_id: string;
    worker_name: string | null;
    external_worker_id: string | null;
    expires_at: string;
    created_at: string;
    credential_blob: Record<string, unknown>;
  }) {
    const exportPayload = buildCredentialExport(credential);
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `credential-${credential.id}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  async function copyCredential(credential: {
    id: string;
    worker_id: string;
    worker_name: string | null;
    external_worker_id: string | null;
    expires_at: string;
    created_at: string;
    credential_blob: Record<string, unknown>;
  }) {
    await navigator.clipboard.writeText(JSON.stringify(buildCredentialExport(credential), null, 2));
    toast.success("Credential copied to clipboard");
  }

  const hasCredentials = useMemo(() => (credentialsQuery.data ?? []).length > 0, [credentialsQuery.data]);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Credentials" subtitle="Track issued credentials, expiries, exports, and revocation status." />
      {credentialsQuery.isLoading ? <LoadingSpinner label="Loading issued credentials..." /> : null}
      {!credentialsQuery.isLoading && !hasCredentials ? (
        <EmptyState title="No credentials issued" description="Issue a credential from the worker detail page and it will appear here for export and review." />
      ) : null}
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
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-full bg-moss px-4 py-2 text-xs text-white"
                onClick={() => downloadCredential(credential)}
              >
                Download credential JSON
              </button>
              <button
                className="rounded-full bg-black/5 px-4 py-2 text-xs"
                onClick={() => void copyCredential(credential)}
              >
                Copy to clipboard
              </button>
              <button
                className="rounded-full bg-ember px-4 py-2 text-xs text-white"
                onClick={() =>
                  setSelectedQr({
                    title: credential.worker_name ?? credential.external_worker_id ?? credential.id,
                    value: JSON.stringify(buildCredentialExport(credential))
                  })
                }
              >
                Share as QR
              </button>
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl bg-black/5 p-4 text-xs">
              {JSON.stringify(credential.credential_blob, null, 2)}
            </pre>
          </div>
        ))}
      </div>
      <CredentialQRModal
        open={Boolean(selectedQr)}
        title={selectedQr?.title ?? "Credential QR"}
        value={selectedQr?.value ?? ""}
        onClose={() => setSelectedQr(null)}
      />
    </section>
  );
}
