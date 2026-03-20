import { PageHeader } from "../../components/PageHeader";
import { QRCodePanel } from "./components/QRCode";
import { useAppStore } from "lib/store";

export function WorkerQRDisplay() {
  const { latestQr } = useAppStore();
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Present QR to gate" subtitle="One-time pseudonym display with countdown and refresh safeguards." />
      <QRCodePanel payload={latestQr?.payload ?? null} expiresAt={latestQr?.expiresAt} />
      <div className="panel text-sm text-black/70">
        QR payload architecture: credential summary, company proof material, live pseudonym, timestamp, and gate nonce.
      </div>
    </section>
  );
}
