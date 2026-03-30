import QRCode from "react-qr-code";

type Props = {
  payload: Record<string, unknown> | null;
  expiresAt?: string;
};

function buildQrReferencePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const pseudonymId = payload.pseudonym_id;
  const nonce = (payload.message as { nonce?: unknown } | undefined)?.nonce;
  if (typeof pseudonymId !== "string" || typeof nonce !== "string") {
    return payload;
  }
  return {
    qr_mode: "ref",
    pseudonym_id: pseudonymId,
    nonce,
    fingerprint: payload.fingerprint,
    generated_at: (payload.message as { generated_at?: unknown } | undefined)?.generated_at,
  };
}

export function QRCodePanel({ payload, expiresAt }: Props) {
  const secondsRemaining = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : null;
  const qrPayload = payload ? buildQrReferencePayload(payload) : null;
  const qrValue = qrPayload ? JSON.stringify(qrPayload) : "";
  const qrByteLength = payload ? new TextEncoder().encode(qrValue).length : 0;
  const qrLevel =
    qrByteLength <= 1200 ? "H" : qrByteLength <= 1600 ? "Q" : qrByteLength <= 2200 ? "M" : "L";
  const canRenderQr = qrByteLength > 0 && qrByteLength <= 2950;

  function handleDownloadSvg() {
    const svg = document.getElementById("worker-live-qr") as SVGElement | null;
    if (!svg) {
      return;
    }
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "worker-pseudonym-qr.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel min-h-72">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live pseudonym QR</h3>
        {secondsRemaining !== null ? <span className="rounded-full bg-moss px-3 py-1 text-xs text-white">{secondsRemaining}s left</span> : null}
      </div>
      <div className="mt-4 flex justify-center">
        {payload ? (
          <div className="space-y-3 text-center">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {canRenderQr ? (
                <QRCode id="worker-live-qr" value={qrValue} size={360} level={qrLevel} />
              ) : (
                <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  Payload is too large for a single QR image. Use Copy QR data and paste it in the gate scanner.
                </div>
              )}
            </div>
            {canRenderQr ? (
              <button className="rounded-full bg-black/5 px-4 py-2 text-xs" onClick={handleDownloadSvg} type="button">
                Download sharp QR (SVG)
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/15 px-6 py-10 text-sm text-black/60">
            Generate a pseudonym to display QR image.
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-black/60">
        Fallback JSON payload (full object, for manual paste/testing):
      </p>
      <pre className="mt-4 overflow-auto rounded-2xl bg-black/5 p-4 text-xs">
        {payload ? JSON.stringify(payload, null, 2) : "Generate a pseudonym to display the QR payload here."}
      </pre>
    </div>
  );
}
