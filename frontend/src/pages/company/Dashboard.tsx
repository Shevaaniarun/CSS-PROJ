import { PageHeader } from "../../components/PageHeader";
import { Link } from "react-router-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCredentials, useWorkers } from "hooks/useCompany";

export function CompanyDashboard() {
  const workersQuery = useWorkers();
  const credentialsQuery = useCredentials();
  const activeWorkers = (workersQuery.data ?? []).filter((worker) => worker.status === "active").length;
  const issuedCredentials = (credentialsQuery.data ?? []).length;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company Portal" title="Worker onboarding and credential operations" subtitle="Manage delivery workers, issue credentials, and monitor access history without exposing worker identity to campus gates." />
      {workersQuery.isLoading || credentialsQuery.isLoading ? <LoadingSpinner label="Loading company workspace..." /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel">
          <div className="text-sm text-black/60">Registered workers</div>
          <div className="mt-3 text-4xl font-semibold text-moss">{(workersQuery.data ?? []).length}</div>
        </div>
        <div className="panel">
          <div className="text-sm text-black/60">Active workers</div>
          <div className="mt-3 text-4xl font-semibold text-moss">{activeWorkers}</div>
        </div>
        <div className="panel">
          <div className="text-sm text-black/60">Issued credentials</div>
          <div className="mt-3 text-4xl font-semibold text-moss">{issuedCredentials}</div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
          <h3 className="text-lg font-semibold">Quick actions</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <Link className="rounded-2xl bg-moss px-4 py-3 text-white" to="/company/workers/new">
              Register a new worker
            </Link>
            <Link className="rounded-2xl bg-black/5 px-4 py-3" to="/company/workers">
              Open worker registry
            </Link>
            <Link className="rounded-2xl bg-black/5 px-4 py-3" to="/company/credentials">
              Review credential exports
            </Link>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-black/70">
              Use worker detail pages when you need to issue a tailored credential or revoke a specific worker.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
