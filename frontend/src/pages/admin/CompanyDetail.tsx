import { PageHeader } from "../../components/PageHeader";
import { usePendingCompanies } from "hooks/useCompany";
import { useParams } from "react-router-dom";

export function AdminCompanyDetail() {
  const { id } = useParams();
  const companiesQuery = usePendingCompanies();
  const company = (companiesQuery.data ?? []).find((item) => item.id === id);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Company detail" subtitle="Inspect public parameters, company officers, worker issuance history, and revocation state." />
      <div className="panel">
        {company ? (
          <div className="grid gap-3 text-sm">
            <div><span className="font-semibold">Name:</span> {company.name}</div>
            <div><span className="font-semibold">Email:</span> {company.email}</div>
            <div><span className="font-semibold">Status:</span> {company.status}</div>
            <div><span className="font-semibold">Submitted:</span> {new Date(company.created_at).toLocaleString()}</div>
          </div>
        ) : (
          <div className="text-sm text-black/60">Company detail is available when the company is still in the pending review list.</div>
        )}
      </div>
    </section>
  );
}
