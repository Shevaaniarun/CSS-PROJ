import { PageHeader } from "../../components/PageHeader";
import { ActivityTable } from "./components/ActivityTable";
import { ApprovalModal } from "./components/ApprovalModal";
import { StatsCards } from "./components/StatsCards";

export function AdminDashboard() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin Console" title="System oversight and trust decisions" subtitle="Review enrollment, monitor gates, revoke compromised entities, and keep an auditable trail without building a central delivery-worker identity database." />
      <StatsCards />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ActivityTable />
        <ApprovalModal />
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
            <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white">View pending companies</button>
            <button className="rounded-2xl bg-ember px-4 py-3 text-sm text-white">View pending gates</button>
            <button className="rounded-2xl bg-white px-4 py-3 text-sm">Review replay attempts</button>
            <button className="rounded-2xl bg-white px-4 py-3 text-sm">Export audit logs</button>
          </div>
        </div>
      </div>
    </section>
  );
}
