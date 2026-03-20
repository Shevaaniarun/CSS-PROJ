import { PageHeader } from "../../components/PageHeader";
import { useAuditLogs } from "hooks/useCompany";

export function AdminAuditLogs() {
  const auditLogsQuery = useAuditLogs();

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Audit logs" subtitle="Search revocations, approvals, and security-sensitive actions with export-ready filters." />
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-black/50">
            <tr>
              <th className="pb-3">Time</th>
              <th className="pb-3">Actor</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {(auditLogsQuery.data ?? []).map((log) => (
              <tr key={log.id} className="border-t border-black/10">
                <td className="py-3">{new Date(log.created_at).toLocaleString()}</td>
                <td className="py-3">{log.actor_type}</td>
                <td className="py-3">{log.action}</td>
                <td className="py-3">
                  {log.entity_type} / {log.entity_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
