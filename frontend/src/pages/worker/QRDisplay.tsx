import { PageHeader } from "../../components/PageHeader";
import { QRCodePanel } from "./components/QRCode";
import { useAppStore } from "lib/store";
import { Link } from "react-router-dom";

export function WorkerQRDisplay() {
  const { latestQr } = useAppStore();
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Present QR to gate" subtitle="One-time pseudonym display with countdown and refresh safeguards." />
      <QRCodePanel payload={latestQr?.payload ?? null} expiresAt={latestQr?.expiresAt} />
      {!latestQr ? (
        <div className="panel text-sm text-black/70">
          No active pseudonym is ready yet. Generate one from the wallet first.
          <div className="mt-4">
            <Link className="rounded-full bg-moss px-4 py-2 text-white" to="/worker/generate-qr">
              Generate QR
            </Link>
          </div>
        </div>
      ) : (
        <div className="panel text-sm text-black/70">
          QR payload architecture: credential summary, company proof material, live pseudonym, timestamp, and gate nonce.
        </div>
      )}
    </section>
  );
}
