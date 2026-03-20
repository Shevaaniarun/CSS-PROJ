import { StoredCredential } from "lib/secureStorage";

type Props = {
  credentials: StoredCredential[];
  onRemove: (credentialId: string) => void;
};

export function CredentialList({ credentials, onRemove }: Props) {
  return (
    <div className="grid gap-4">
      {credentials.length === 0 ? (
        <div className="panel text-sm text-black/60">
          No credential imported yet. Paste a credential JSON bundle below to seed the wallet.
        </div>
      ) : null}
      {credentials.map((credential) => (
        <div key={credential.id} className="panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{credential.company}</h3>
              <p className="text-sm text-black/60">{credential.role}</p>
              <p className="mt-2 text-xs text-black/50">Credential ID: {credential.credentialId}</p>
              <p className="text-xs text-black/50">Expires: {new Date(credential.expiry).toLocaleString()}</p>
            </div>
            <button className="rounded-full bg-ember px-3 py-2 text-xs text-white" onClick={() => onRemove(credential.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
