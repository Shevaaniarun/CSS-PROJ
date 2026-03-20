import { PageHeader } from "../../components/PageHeader";
import { QRCodePanel } from "./components/QRCode";
import { useAppStore } from "lib/store";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function WorkerQRDisplay() {
  const navigate = useNavigate();
  const { latestQr } = useAppStore();
  const totalSeconds = 300;
  const remainingSeconds = latestQr?.expiresAt
    ? Math.max(0, Math.floor((new Date(latestQr.expiresAt).getTime() - Date.now()) / 1000))
    : 0;
  const progress = latestQr ? Math.max(0, (remainingSeconds / totalSeconds) * 100) : 0;
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
        <div className="panel space-y-4 text-sm text-black/70">
          <div>
            QR payload architecture: credential summary, company proof material, live pseudonym, timestamp, and gate nonce.
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs text-black/55">
              <span>Expiry progress</span>
              <span>{remainingSeconds}s left</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-moss px-4 py-2 text-white"
              onClick={() => navigate("/worker/generate-qr")}
            >
              Regenerate
            </button>
            <button
              className="rounded-full bg-black/5 px-4 py-2"
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(latestQr.payload, null, 2));
                toast.success("QR payload copied");
              }}
            >
              Copy QR data
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
