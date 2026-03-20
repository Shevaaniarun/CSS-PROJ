import { PageHeader } from "../../components/PageHeader";

export function WorkerHistory() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Access history" subtitle="View gate outcomes and pseudonym usage without revealing raw credential material." />
      <div className="panel">Chronological grant and deny history.</div>
    </section>
  );
}

