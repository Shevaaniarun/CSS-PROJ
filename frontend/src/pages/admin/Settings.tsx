import { PageHeader } from "../../components/PageHeader";

export function AdminSettings() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="System settings" subtitle="Tune token lifetime, nonce windows, rate limits, and CSP/security configuration." />
      <div className="panel">Environment and policy settings.</div>
    </section>
  );
}

