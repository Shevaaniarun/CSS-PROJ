type Props = {
  payload: Record<string, unknown> | null;
  expiresAt?: string;
};

export function QRCodePanel({ payload, expiresAt }: Props) {
  const secondsRemaining = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : null;

  return (
    <div className="panel min-h-72">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live pseudonym payload</h3>
        {secondsRemaining !== null ? <span className="rounded-full bg-moss px-3 py-1 text-xs text-white">{secondsRemaining}s left</span> : null}
      </div>
      <pre className="mt-4 overflow-auto rounded-2xl bg-black/5 p-4 text-xs">
        {payload ? JSON.stringify(payload, null, 2) : "Generate a pseudonym to display the QR payload here."}
      </pre>
    </div>
  );
}
