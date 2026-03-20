import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "./components/StatusBadge";

export function WorkerCredentialDetail() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credential detail" subtitle="Credential metadata, attribute set, issuer information, and local protection state." />
      <StatusBadge />
      <div className="panel">Credential detail and import/export information.</div>
    </section>
  );
}

