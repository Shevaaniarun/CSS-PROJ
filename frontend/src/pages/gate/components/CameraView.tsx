import { useId, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

type Props = {
  qrText: string;
  onQrTextChange: (value: string) => void;
  onVerify: () => void;
  busy?: boolean;
};

export function CameraView({ qrText, onQrTextChange, onVerify, busy }: Props) {
  const scannerId = useId().replace(/:/g, "");
  const [scannerReady, setScannerReady] = useState(false);

  function handleEnableScanner() {
    const element = document.getElementById(scannerId);
    if (!element || element.childElementCount > 0) {
      setScannerReady(true);
      return;
    }
    const scanner = new Html5QrcodeScanner(scannerId, { fps: 10, qrbox: 220 }, false);
    scanner.render(
      async (decodedText) => {
        onQrTextChange(decodedText);
        await scanner.clear();
      },
      () => undefined
    );
    setScannerReady(true);
  }

  return (
    <div className="panel min-h-80 bg-ink text-white">
      <h3 className="text-lg font-semibold">Scan or paste QR payload</h3>
      <p className="mt-2 text-sm text-white/70">
        Use the camera scanner for a live worker QR, or paste the JSON payload for local testing.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white" type="button" onClick={handleEnableScanner}>
          {scannerReady ? "Scanner ready" : "Enable camera scanner"}
        </button>
      </div>
      <div id={scannerId} className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2" />
      <textarea
        className="mt-4 min-h-48 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white"
        placeholder="Paste scanned QR JSON here"
        value={qrText}
        onChange={(event) => onQrTextChange(event.target.value)}
      />
      <button
        className="mt-4 rounded-2xl bg-amber-200 px-4 py-3 text-sm font-medium text-ink disabled:opacity-50"
        disabled={busy}
        onClick={onVerify}
      >
        {busy ? "Verifying..." : "Run 7-step verification"}
      </button>
    </div>
  );
}
