import { PageHeader } from "../../components/PageHeader";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useIssueCredential, useRevokeWorker, useWorkers } from "hooks/useCompany";
import { IssueCredential } from "./components/IssueCredential";

export function CompanyWorkerDetail() {
  const { id } = useParams();
  const workersQuery = useWorkers();
  const issueCredential = useIssueCredential();
  const revokeWorker = useRevokeWorker();
  const worker = useMemo(
    () => (workersQuery.data ?? []).find((item) => item.id === id),
    [id, workersQuery.data]
  );

  if (!worker) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Company" title="Worker detail" subtitle="Review worker state, inspect access history, and issue or revoke credentials." />
        <div className="panel text-sm text-black/60">Worker not found. Return to the workers list and select a valid worker.</div>
      </section>
    );
  }

  const defaultAttributes = Object.entries(worker.attributes).map(([key, value]) => `${key}:${String(value)}`);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Worker detail" subtitle="Review worker state, inspect access history, and issue or revoke credentials." />
      <div className="panel grid gap-3 text-sm">
        <div><span className="font-semibold">Name:</span> {worker.full_name}</div>
        <div><span className="font-semibold">Worker ID:</span> {worker.external_worker_id}</div>
        <div><span className="font-semibold">Phone:</span> {worker.phone}</div>
        <div><span className="font-semibold">Status:</span> {worker.status}</div>
      </div>
      <IssueCredential
        workerId={worker.id}
        defaultRole={String(worker.attributes.role ?? "delivery")}
        defaultAttributes={defaultAttributes}
        busy={issueCredential.isPending}
        onIssue={(payload) => issueCredential.mutate(payload)}
      />
      {issueCredential.isSuccess ? <div className="panel text-sm text-moss">Credential issued successfully for {worker.full_name}.</div> : null}
      <div className="panel">
        <h3 className="text-lg font-semibold">Revocation</h3>
        <p className="mt-2 text-sm text-black/70">
          Revoking a worker adds the worker ID to the revocation list and blocks future gate access even if an old credential is presented.
        </p>
        <button
          className="mt-4 rounded-2xl bg-ember px-4 py-3 text-sm text-white"
          disabled={revokeWorker.isPending}
          onClick={() => revokeWorker.mutate(worker.id)}
        >
          {revokeWorker.isPending ? "Revoking..." : "Revoke worker"}
        </button>
      </div>
    </section>
  );
}
