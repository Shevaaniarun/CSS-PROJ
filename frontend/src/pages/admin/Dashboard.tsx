import { PageHeader } from "../../components/PageHeader";
import { ActivityTable } from "./components/ActivityTable";
import { ApprovalModal } from "./components/ApprovalModal";
import { StatsCards } from "./components/StatsCards";
import { useAccessLogs, useAdminStats, useApproveCompany, usePendingCompanies, usePendingGates } from "hooks/useCompany";

export function AdminDashboard() {
  const statsQuery = useAdminStats();
  const accessLogsQuery = useAccessLogs();
  const companiesQuery = usePendingCompanies();
  const gatesQuery = usePendingGates();
  const approveCompany = useApproveCompany();

  const stats = [
    { label: "Pending Companies", value: statsQuery.data?.pending_companies ?? 0 },
    { label: "Pending Gates", value: statsQuery.data?.pending_gates ?? 0 },
    { label: "Granted Attempts", value: statsQuery.data?.granted ?? 0 },
    { label: "Denied Attempts", value: statsQuery.data?.denied ?? 0 }
  ];

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin Console" title="System oversight and trust decisions" subtitle="Review enrollment, monitor gates, revoke compromised entities, and keep an auditable trail without building a central delivery-worker identity database." />
      <StatsCards stats={stats} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ActivityTable rows={accessLogsQuery.data ?? []} />
        <ApprovalModal
          companies={(companiesQuery.data ?? []).map((company) => ({
            id: company.id,
            label: `${company.name} (${company.email})`,
            status: company.status,
            created_at: company.created_at
          }))}
          gates={(gatesQuery.data ?? []).map((gate) => ({
            id: gate.id,
            label: `${gate.name} · ${gate.location}`,
            status: gate.status,
            created_at: gate.created_at
          }))}
          busyCompanyId={approveCompany.variables?.companyId}
          onApproveCompany={(companyId, approve) =>
            approveCompany.mutate({
              companyId,
              approve,
              notes: approve ? "Approved from dashboard" : "Rejected from dashboard"
            })
          }
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Approval flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Review pending company and gate registrations.</li>
            <li>2. Validate license, institution, contact, and device metadata manually.</li>
            <li>3. Approve trusted entities or reject invalid registrations.</li>
            <li>4. Distribute trusted public keys to approved gates.</li>
            <li>5. Revoke companies, gates, or workers when misuse is detected.</li>
          </ol>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Admin controls</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-moss px-4 py-3 text-sm text-white">Polling live every 5 seconds</div>
            <div className="rounded-2xl bg-ember px-4 py-3 text-sm text-white">
              {companiesQuery.data?.length ?? 0} companies waiting for trust review
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm">
              {gatesQuery.data?.length ?? 0} gates waiting for deployment approval
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm">
              {statsQuery.data?.total_attempts ?? 0} total access attempts recorded
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
