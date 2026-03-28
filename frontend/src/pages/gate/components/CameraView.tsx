import { ChangeEvent, useId, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";

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

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const scanner = new Html5Qrcode(scannerId);
      const fileToScan = file.type === "image/svg+xml" ? await rasterizeSvgToPngFile(file) : file;
      const decodedText = await scanner.scanFile(fileToScan, true);
      onQrTextChange(decodedText);
      toast.success("QR image decoded successfully");
    } catch {
      toast.error("Could not decode a QR code from the selected image");
    } finally {
      event.target.value = "";
    }
  }

  async function rasterizeSvgToPngFile(file: File): Promise<File> {
    const svgText = await file.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load SVG image"));
        img.src = url;
      });

      const width = Math.max(1024, image.naturalWidth || image.width || 1024);
      const height = Math.max(1024, image.naturalHeight || image.height || 1024);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable");
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to render PNG blob"));
            return;
          }
          resolve(blob);
        }, "image/png", 1);
      });

      return new File([pngBlob], `${file.name.replace(/\.svg$/i, "") || "qr"}.png`, {
        type: "image/png",
      });
    } finally {
      URL.revokeObjectURL(url);
    }
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
        <label className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">
          Upload QR image
          <input className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
        </label>
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
