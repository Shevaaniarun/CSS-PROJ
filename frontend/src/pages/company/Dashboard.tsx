import { PageHeader } from "../../components/PageHeader";
import { useWorkers } from "hooks/useCompany";

export function CompanyDashboard() {
  const workersQuery = useWorkers();
  const activeWorkers = (workersQuery.data ?? []).filter((worker) => worker.status === "active").length;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company Portal" title="Worker onboarding and credential operations" subtitle="Manage delivery workers, issue credentials, and monitor access history without exposing worker identity to campus gates." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Lifecycle</h3>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Company registers and waits for admin approval.</li>
            <li>2. Approved company maintains its CA key pair.</li>
            <li>3. Company adds workers and issues paper-based credentials.</li>
            <li>4. Workers receive credential JSON or QR once during onboarding.</li>
            <li>5. Company can revoke workers at any time.</li>
          </ol>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Current company snapshot</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-black/5 p-4">Workers registered: {(workersQuery.data ?? []).length}</div>
            <div className="rounded-2xl bg-black/5 p-4">Active workers: {activeWorkers}</div>
            <div className="rounded-2xl bg-black/5 p-4">Credential issue flow runs from the worker registry page.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
