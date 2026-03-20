type Props = {
  qrText: string;
  onQrTextChange: (value: string) => void;
  onVerify: () => void;
  busy?: boolean;
};

export function CameraView({ qrText, onQrTextChange, onVerify, busy }: Props) {
  return (
    <div className="panel min-h-80 bg-ink text-white">
      <h3 className="text-lg font-semibold">Scan or paste QR payload</h3>
      <p className="mt-2 text-sm text-white/70">
        The live kiosk camera can feed this box, but a JSON payload paste keeps local development moving.
      </p>
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
