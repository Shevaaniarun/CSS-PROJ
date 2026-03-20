type Props = {
  status: "success" | "failure";
  reason?: string | null;
  checks?: Record<string, boolean>;
  countdown?: number;
};

export function ResultScreen({ status, reason, checks, countdown }: Props) {
  return (
    <div className={`panel min-h-60 ${status === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-3xl font-semibold">{status === "success" ? "Access granted" : "Access denied"}</div>
        {typeof countdown === "number" ? <div className="rounded-full bg-white/15 px-3 py-1 text-sm">Reset in {countdown}s</div> : null}
      </div>
      {reason ? <div className="mt-3 text-sm text-white/85">Reason: {reason}</div> : null}
      {checks ? (
        <div className="mt-5 grid gap-2 text-sm">
          {Object.entries(checks).map(([label, passed]) => (
            <div key={label} className="rounded-2xl bg-white/10 px-3 py-2">
              {label}: {passed ? "passed" : "failed"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
