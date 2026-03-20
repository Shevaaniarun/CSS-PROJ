import { PageHeader } from "../../components/PageHeader";
import { CameraView } from "./components/CameraView";
import { OfflineIndicator } from "./components/OfflineIndicator";

export function GateScanner() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Scan one-time worker pseudonyms" subtitle="The kiosk performs signature, expiry, nonce, trust, revocation, and replay checks in sequence." />
      <OfflineIndicator />
      <CameraView />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Gate flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Check gate status and sync trusted company keys.</li>
            <li>2. Generate a short-lived nonce for the worker.</li>
            <li>3. Scan the live QR produced by the worker.</li>
            <li>4. Run the 7-step verification pipeline.</li>
            <li>5. Grant or deny access and record the attempt.</li>
          </ol>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Verification steps</h3>
          <div className="mt-4 grid gap-2 text-sm text-black/70">
            <div>Signature verification</div>
            <div>Credential expiry check</div>
            <div>Timestamp freshness window</div>
            <div>Nonce match and expiry</div>
            <div>Trusted company check</div>
            <div>Revocation list check</div>
            <div>Pseudonym replay check</div>
          </div>
        </div>
      </div>
    </section>
  );
}
