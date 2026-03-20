import { ChangeEvent, FormEvent, useId, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { StoredCredential, validateImportedCredential } from "lib/secureStorage";

type Props = {
  onImport: (credential: StoredCredential) => void;
  busy?: boolean;
};

type ImportMode = "paste" | "file" | "scan";

export function CredentialImportPanel({ onImport, busy }: Props) {
  const [mode, setMode] = useState<ImportMode>("paste");
  const [credentialText, setCredentialText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const scannerId = useId().replace(/:/g, "");

  function importPayload(parsed: Record<string, unknown>) {
    const validation = validateImportedCredential(parsed);
    if (!validation.ok) {
      setError(validation.error);
      setSuccess(null);
      return;
    }
    onImport(validation.credential);
    setCredentialText("");
    setError(null);
    setSuccess(`Imported credential for ${validation.credential.company}`);
  }

  function handlePasteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      importPayload(JSON.parse(credentialText) as Record<string, unknown>);
    } catch {
      setError("Credential JSON is invalid.");
      setSuccess(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importPayload(JSON.parse(String(reader.result)) as Record<string, unknown>);
      } catch {
        setError("Selected file is not valid credential JSON.");
        setSuccess(null);
      }
    };
    reader.readAsText(file);
  }

  function handleEnableScanner() {
    const existing = document.getElementById(scannerId);
    if (!existing || existing.childElementCount > 0) {
      return;
    }
    const scanner = new Html5QrcodeScanner(scannerId, { fps: 10, qrbox: 220 }, false);
    scanner.render(
      async (decodedText) => {
        try {
          importPayload(JSON.parse(decodedText) as Record<string, unknown>);
          await scanner.clear();
        } catch {
          setError("Scanned QR did not contain valid credential JSON.");
          setSuccess(null);
        }
      },
      () => undefined
    );
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["paste", "file", "scan"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${mode === item ? "bg-moss text-white" : "bg-black/5"}`}
            onClick={() => {
              setMode(item);
              if (item === "scan") {
                setTimeout(handleEnableScanner, 0);
              }
            }}
          >
            {item === "paste" ? "Paste JSON" : item === "file" ? "Upload file" : "Scan QR"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <form className="space-y-4" onSubmit={handlePasteSubmit}>
          <textarea
            className="min-h-44 w-full rounded-2xl border border-black/10 px-4 py-3"
            placeholder="Paste credential JSON from company onboarding"
            value={credentialText}
            onChange={(event) => setCredentialText(event.target.value)}
          />
          <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white" disabled={busy}>
            {busy ? "Importing..." : "Import credential"}
          </button>
        </form>
      ) : null}

      {mode === "file" ? (
        <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-3xl border border-dashed border-black/15 bg-black/5 px-4 py-6 text-sm text-black/70">
          Choose a credential JSON file
          <input className="hidden" type="file" accept=".json,application/json" onChange={handleFileChange} />
        </label>
      ) : null}

      {mode === "scan" ? (
        <div className="space-y-3">
          <div className="text-sm text-black/60">Grant camera access and scan the credential QR from the onboarding device.</div>
          <div id={scannerId} className="overflow-hidden rounded-3xl border border-black/10 bg-black/5 p-2" />
        </div>
      ) : null}

      {error ? <div className="text-sm text-ember">{error}</div> : null}
      {success ? <div className="text-sm text-moss">{success}</div> : null}
    </div>
  );
}
