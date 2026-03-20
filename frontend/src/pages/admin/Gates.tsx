import { PageHeader } from "../../components/PageHeader";
import { useApproveGate, usePendingGates } from "hooks/useCompany";

export function AdminGates() {
  const gatesQuery = usePendingGates();
  const approveGate = useApproveGate();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Gate management" subtitle="Register kiosks, review offline sync health, and rotate gate trust bundles." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Pending gates</h3>
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {(gatesQuery.data ?? []).map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-black/10 p-4">
                <div className="font-medium text-black">{gate.name}</div>
                <div>{gate.location}</div>
                <div className="text-xs text-black/50">Identifier: {gate.identifier}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-full bg-moss px-3 py-2 text-xs text-white"
                    onClick={() => approveGate.mutate({ gateId: gate.id, approve: true, notes: "Approved from gates page" })}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-full bg-ember px-3 py-2 text-xs text-white"
                    onClick={() => approveGate.mutate({ gateId: gate.id, approve: false, notes: "Rejected from gates page" })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {(gatesQuery.data ?? []).length === 0 ? <div>No gates are waiting for approval.</div> : null}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Cached trust bundle</h3>
          <p className="mt-4 text-sm text-black/70">
            Gates operate online with live syncs and offline with the most recent locally cached company keys and revocation list.
          </p>
        </div>
      </div>
    </section>
  );
}
