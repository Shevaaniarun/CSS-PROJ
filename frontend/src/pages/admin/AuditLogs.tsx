import { PageHeader } from "../../components/PageHeader";

export function AdminAuditLogs() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Audit logs" subtitle="Search revocations, approvals, and security-sensitive actions with export-ready filters." />
      <div className="panel">Filterable audit log explorer and CSV export controls.</div>
    </section>
  );
}

