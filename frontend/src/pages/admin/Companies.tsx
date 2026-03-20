import { PageHeader } from "../../components/PageHeader";
import { useApproveCompany, usePendingCompanies } from "hooks/useCompany";

export function AdminCompanies() {
  const companiesQuery = usePendingCompanies();
  const approveCompany = useApproveCompany();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Company approvals" subtitle="Pending, approved, rejected, and revoked organizations with reviewer notes and public key metadata." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="panel">
          <h3 className="text-lg font-semibold">Pending company queue</h3>
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {(companiesQuery.data ?? []).map((company) => (
              <div key={company.id} className="rounded-2xl border border-black/10 p-4">
                <div className="font-medium text-black">{company.name}</div>
                <div>{company.email}</div>
                <div className="text-xs text-black/50">{new Date(company.created_at).toLocaleString()}</div>
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
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Decision states</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-amber-100 px-4 py-3">Pending</div>
            <div className="rounded-2xl bg-green-100 px-4 py-3">Approved</div>
            <div className="rounded-2xl bg-red-100 px-4 py-3">Rejected / Revoked</div>
          </div>
        </div>
      </div>
    </section>
  );
}
