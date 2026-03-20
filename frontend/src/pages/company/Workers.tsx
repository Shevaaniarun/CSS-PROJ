import { PageHeader } from "../../components/PageHeader";
import { WorkerTable } from "./components/WorkerTable";
import { useIssueCredential, useRevokeWorker, useWorkers, WorkerSummary } from "hooks/useCompany";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "sonner";

function deriveCredentialAttributes(worker: WorkerSummary): string[] {
  return [
    `company:${String(worker.attributes.company ?? "approved")}`,
    `role:${String(worker.attributes.role ?? "delivery")}`,
    `campus_access:${String(worker.attributes.campus_access ?? "active")}`
  ];
}

export function CompanyWorkers() {
  const workersQuery = useWorkers();
  const issueCredential = useIssueCredential();
  const revokeWorker = useRevokeWorker();

  function handleIssueCredential(worker: WorkerSummary) {
    const role = String(worker.attributes.role ?? "delivery");
    const attributes = deriveCredentialAttributes(worker);
    issueCredential.mutate(
      {
        worker_id: worker.id,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        role,
        attributes
      },
      {
        onSuccess: () => toast.success(`Credential issued for ${worker.full_name}`),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Credential issuance failed")
      }
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Workers" subtitle="Register and manage worker attributes such as employer, role, route type, and service scope." />
      {workersQuery.isLoading ? <LoadingSpinner label="Loading workers..." /> : null}
      {!workersQuery.isLoading && (workersQuery.data ?? []).length === 0 ? (
        <EmptyState title="No workers registered" description="Create your first worker to begin issuing credentials for campus access." />
      ) : null}
      {(workersQuery.data ?? []).length > 0 ? (
        <WorkerTable
          workers={workersQuery.data ?? []}
          busyWorkerId={revokeWorker.variables ?? undefined}
          onIssueCredential={handleIssueCredential}
          onRevokeWorker={(workerId) =>
            revokeWorker.mutate(workerId, {
              onSuccess: () => toast.success("Worker revoked"),
              onError: (error) => toast.error(error instanceof Error ? error.message : "Worker revoke failed")
            })
          }
        />
      ) : null}
      {issueCredential.isSuccess ? (
        <div className="panel text-sm text-moss">Credential issued successfully. The worker can now import it into the wallet.</div>
      ) : null}
    </section>
  );
}
