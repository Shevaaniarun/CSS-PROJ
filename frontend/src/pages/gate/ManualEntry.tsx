import { PageHeader } from "../../components/PageHeader";
import { FormEvent, useState } from "react";
import { useAppStore } from "lib/store";

export function GateManualEntry() {
  const { setLatestGateResult } = useAppStore();
  const [workerReference, setWorkerReference] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLatestGateResult({
      granted: true,
      failureReason: null,
      timestamp: new Date().toISOString(),
      checks: {
        manual_override: true,
        operator_review: true
      }
    });
    setWorkerReference("");
    setNote("");
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Manual override" subtitle="Fallback path for camera failure, with override note capture and audit logging." />
      <form className="panel grid gap-4" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="Worker reference or delivery order id"
          value={workerReference}
          onChange={(event) => setWorkerReference(event.target.value)}
        />
        <textarea
          className="rounded-2xl border border-black/10 px-4 py-3"
          rows={5}
          placeholder="Operator note for the manual review path"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <button className="rounded-2xl bg-ember px-4 py-3 text-sm text-white">Record manual override</button>
      </form>
    </section>
  );
}
