import { PageHeader } from "../../components/PageHeader";
import { useApproveGate, useGates } from "hooks/useCompany";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";

export function AdminGates() {
  const gatesQuery = useGates();
  const approveGate = useApproveGate();
  const gates = gatesQuery.data ?? [];
  const pending = gates.filter((gate) => gate.status === "pending");
  const approved = gates.filter((gate) => gate.status === "approved");
  const rejected = gates.filter((gate) => gate.status === "rejected" || gate.status === "revoked" || gate.status === "expired");

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Gate management" subtitle="Register kiosks, review offline sync health, and rotate gate trust bundles." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Gate registry</h3>
          {gatesQuery.isLoading ? <div className="mt-4"><LoadingSpinner label="Loading gates..." /></div> : null}
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {!gatesQuery.isLoading && gates.length === 0 ? (
              <EmptyState title="No pending gates" description="Approved and pending gate kiosks will appear here for operational review." />
            ) : null}
            {gates.map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-black">{gate.name}</div>
                    <div>{gate.location}</div>
                    <div className="text-xs text-black/50">Identifier: {gate.identifier}</div>
                  </div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs capitalize">{gate.status}</span>
                </div>
                {gate.status === "pending" ? (
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
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Cached trust bundle</h3>
          <p className="mt-4 text-sm text-black/70">
            Gates operate online with live syncs and offline with the most recent locally cached company keys and revocation list.
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-amber-100 px-4 py-3 text-black">Pending: {pending.length}</div>
            <div className="rounded-2xl bg-green-100 px-4 py-3 text-black">Approved: {approved.length}</div>
            <div className="rounded-2xl bg-red-100 px-4 py-3 text-black">Rejected / Revoked / Expired: {rejected.length}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
