import { PageHeader } from "../../components/PageHeader";
import { WorkerTable } from "./components/WorkerTable";
import { useIssueCredential, useRevokeWorker, useWorkers, WorkerSummary } from "hooks/useCompany";

export function CompanyWorkers() {
  const workersQuery = useWorkers();
  const issueCredential = useIssueCredential();
  const revokeWorker = useRevokeWorker();

  function handleIssueCredential(worker: WorkerSummary) {
    const role = String(worker.attributes.role ?? "delivery");
    const attributes = Object.entries(worker.attributes).map(([key, value]) => `${key}:${String(value)}`);
    issueCredential.mutate({
      worker_id: worker.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      role,
      attributes
    });
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Workers" subtitle="Register and manage worker attributes such as employer, role, route type, and service scope." />
      <WorkerTable
        workers={workersQuery.data ?? []}
        busyWorkerId={revokeWorker.variables ?? undefined}
        onIssueCredential={handleIssueCredential}
        onRevokeWorker={(workerId) => revokeWorker.mutate(workerId)}
      />
      {issueCredential.isSuccess ? (
        <div className="panel text-sm text-moss">Credential issued successfully. The worker can now import it into the wallet.</div>
      ) : null}
    </section>
  );
}
