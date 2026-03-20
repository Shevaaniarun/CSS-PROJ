import { PageHeader } from "../../components/PageHeader";

export function GateManualEntry() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Gate Kiosk" title="Manual override" subtitle="Fallback path for camera failure, with override note capture and audit logging." />
      <div className="panel">Manual entry and override review form.</div>
    </section>
  );
}

