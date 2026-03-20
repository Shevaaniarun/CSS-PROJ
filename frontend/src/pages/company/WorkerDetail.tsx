import { PageHeader } from "../../components/PageHeader";
import { IssueCredential } from "./components/IssueCredential";

export function CompanyWorkerDetail() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Worker detail" subtitle="Review worker state, inspect access history, and issue or revoke credentials." />
      <IssueCredential />
      <div className="panel">
        <h3 className="text-lg font-semibold">Revocation</h3>
        <p className="mt-2 text-sm text-black/70">
          Revoking a worker adds the worker ID to the revocation list and blocks future gate access even if an old credential is presented.
        </p>
      </div>
    </section>
  );
}
