import { Link } from "react-router-dom";
import { WorkerCredentialRecord } from "hooks/useWorker";

type Props = {
  credentials: WorkerCredentialRecord[];
};

export function CredentialList({ credentials }: Props) {
  return (
    <div className="grid gap-4">
      {credentials.map((credential) => (
        <div key={credential.id} className="panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                {String(credential.credential_blob.company ?? credential.company_name ?? "Credential")}
              </h3>
              <p className="text-sm text-black/60">{String(credential.credential_blob.role ?? "delivery")}</p>
              <p className="mt-2 text-xs text-black/50">Credential ID: {credential.id}</p>
              <p className="text-xs text-black/50">Expires: {new Date(credential.expires_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs capitalize">{credential.status}</span>
              <Link className="rounded-full bg-moss px-3 py-2 text-xs text-white" to={`/worker/credentials/${credential.id}`}>
                View detail
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
