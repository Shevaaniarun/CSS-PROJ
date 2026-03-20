import { PageHeader } from "../../components/PageHeader";
import { useApproveCompany, useCompanies } from "hooks/useCompany";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";

export function AdminCompanies() {
  const companiesQuery = useCompanies();
  const approveCompany = useApproveCompany();
  const companies = companiesQuery.data ?? [];
  const actionable = companies.filter((company) => company.status === "pending");
  const approved = companies.filter((company) => company.status === "approved");
  const rejected = companies.filter((company) => company.status === "rejected" || company.status === "revoked");

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Company approvals" subtitle="Pending, approved, rejected, and revoked organizations with reviewer notes and public key metadata." />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel">
          <h3 className="text-lg font-semibold">Company registry</h3>
          {companiesQuery.isLoading ? <div className="mt-4"><LoadingSpinner label="Loading companies..." /></div> : null}
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {!companiesQuery.isLoading && companies.length === 0 ? (
              <EmptyState title="No pending companies" description="New company registrations will appear here for trust review and approval." />
            ) : null}
            {companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-black">{company.name}</div>
                    <div>{company.email}</div>
                    <div className="text-xs text-black/50">{new Date(company.created_at).toLocaleString()}</div>
                  </div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs capitalize">{company.status}</span>
                </div>
                {company.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-full bg-moss px-3 py-2 text-xs text-white"
                      onClick={() => approveCompany.mutate({ companyId: company.id, approve: true, notes: "Approved from company review page" })}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-full bg-ember px-3 py-2 text-xs text-white"
                      onClick={() => approveCompany.mutate({ companyId: company.id, approve: false, notes: "Rejected from company review page" })}
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
          <h3 className="text-lg font-semibold">Decision states</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-amber-100 px-4 py-3 text-black">Pending: {actionable.length}</div>
            <div className="rounded-2xl bg-green-100 px-4 py-3 text-black">Approved: {approved.length}</div>
            <div className="rounded-2xl bg-red-100 px-4 py-3 text-black">Rejected / Revoked: {rejected.length}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
