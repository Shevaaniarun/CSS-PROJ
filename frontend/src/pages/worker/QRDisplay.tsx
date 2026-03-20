import { PageHeader } from "../../components/PageHeader";
import { QRCodePanel } from "./components/QRCode";

export function WorkerQRDisplay() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Present QR to gate" subtitle="One-time pseudonym display with countdown and refresh safeguards." />
      <QRCodePanel />
      <div className="panel text-sm text-black/70">
        QR payload architecture: credential summary, company proof material, live pseudonym, timestamp, and gate nonce.
      </div>
    </section>
  );
}
