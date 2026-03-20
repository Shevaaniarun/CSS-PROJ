import { PageHeader } from "../../components/PageHeader";

export function AdminCompanyDetail() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Company detail" subtitle="Inspect public parameters, company officers, worker issuance history, and revocation state." />
      <div className="panel">Detailed company approval and trust profile.</div>
    </section>
  );
}

