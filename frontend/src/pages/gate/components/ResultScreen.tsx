type Props = {
  status: "success" | "failure";
  reason?: string | null;
  checks?: Record<string, boolean>;
  countdown?: number;
};

const ORDERED_CHECK_KEYS = [
  "signature_verified",
  "expiry_check_passed",
  "timestamp_check_passed",
  "nonce_check_passed",
  "trust_check_passed",
  "revocation_check_passed",
  "replay_check_passed",
] as const;

type CheckKey = (typeof ORDERED_CHECK_KEYS)[number];

const CHECK_LABELS: Record<CheckKey, string> = {
  signature_verified: "Signature verified",
  expiry_check_passed: "Credential not expired",
  timestamp_check_passed: "Timestamp in allowed window",
  nonce_check_passed: "Gate nonce matched and valid",
  trust_check_passed: "Company trust approved",
  revocation_check_passed: "No entity revoked",
  replay_check_passed: "Not a replayed pseudonym",
};

const CHECK_HELP: Record<CheckKey, { pass: string; fail: string }> = {
  signature_verified: {
    pass: "Cryptographic proof matches the payload and issuer parameters.",
    fail: "Signature/proof verification failed for this payload.",
  },
  expiry_check_passed: {
    pass: "Credential expiry time is still valid.",
    fail: "Credential is expired or has invalid expiry metadata.",
  },
  timestamp_check_passed: {
    pass: "Scan timestamp is within freshness tolerance.",
    fail: "Timestamp is outside the allowed freshness window.",
  },
  nonce_check_passed: {
    pass: "Worker response includes the active gate nonce and nonce is unconsumed.",
    fail: "Nonce mismatch, expired nonce, or nonce already consumed.",
  },
  trust_check_passed: {
    pass: "Issuer company is currently in approved state.",
    fail: "Issuer company is not approved/trusted at verification time.",
  },
  revocation_check_passed: {
    pass: "Gate, company, worker, credential, and pseudonym are not revoked.",
    fail: "One or more related entities are revoked.",
  },
  replay_check_passed: {
    pass: "This pseudonym was not previously used at any gate verification.",
    fail: "Replay detected: pseudonym was already used before.",
  },
};

function formatReason(reason?: string | null): string {
  if (!reason) {
    return "No failure reason.";
  }
  return reason.split("_").join(" ");
}

export function ResultScreen({ status, reason, checks, countdown }: Props) {
  const entries = ORDERED_CHECK_KEYS.map((key) => ({
    key,
    passed: Boolean(checks?.[key]),
  }));
  const passedCount = entries.filter((entry) => entry.passed).length;
  const failed = entries.filter((entry) => !entry.passed).map((entry) => CHECK_LABELS[entry.key]);

  return (
    <div className={`panel min-h-60 ${status === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-3xl font-semibold">{status === "success" ? "Access granted" : "Access denied"}</div>
        {typeof countdown === "number" ? <div className="rounded-full bg-white/15 px-3 py-1 text-sm">Reset in {countdown}s</div> : null}
      </div>
      <div className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/90">
        {status === "success"
          ? `Verification passed: ${passedCount}/${entries.length} checks succeeded.`
          : `Verification failed: ${passedCount}/${entries.length} checks succeeded.`}
      </div>
      {reason || status === "failure" ? <div className="mt-2 text-sm text-white/85">Reason: {formatReason(reason)}</div> : null}
      {status === "success" ? (
        <div className="mt-2 text-sm text-white/85">
          This worker proof satisfied signature, freshness, trust, revocation, and replay constraints.
        </div>
      ) : null}
      {status === "failure" && failed.length > 0 ? (
        <div className="mt-2 text-sm text-white/85">Failed checks: {failed.join(", ")}.</div>
      ) : null}
      <div className="mt-5 grid gap-2 text-sm">
        {entries.map(({ key, passed }) => (
          <div key={key} className="rounded-2xl bg-white/10 px-3 py-2">
              <div className="font-medium">
                {CHECK_LABELS[key]}: {passed ? "passed" : "failed"}
              </div>
              <div className="mt-1 text-xs text-white/80">
                {passed ? CHECK_HELP[key].pass : CHECK_HELP[key].fail}
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
