import { PageHeader } from "../../components/PageHeader";

export function AdminCompanies() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Company approvals" subtitle="Pending, approved, rejected, and revoked organizations with reviewer notes and public key metadata." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="panel">
          <h3 className="text-lg font-semibold">Required company details</h3>
          <div className="mt-4 grid gap-3 text-sm text-black/70">
            <div>Name and organization identity</div>
            <div>License or legal registration ID</div>
            <div>Contact owner, phone, and email</div>
            <div>Operational metadata and notes</div>
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
