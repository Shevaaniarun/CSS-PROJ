import { Link } from "react-router-dom";
import { WorkerSummary } from "hooks/useCompany";

type Props = {
  workers: WorkerSummary[];
  onIssueCredential: (worker: WorkerSummary) => void;
  onRevokeWorker: (workerId: string) => void;
  busyWorkerId?: string;
};

export function WorkerTable({ workers, onIssueCredential, onRevokeWorker, busyWorkerId }: Props) {
  return (
    <div className="panel overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Worker registry</h3>
        <div className="text-sm text-black/50">{workers.length} total workers</div>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-black/50">
          <tr>
            <th className="pb-3">Worker</th>
            <th className="pb-3">External ID</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker) => (
            <tr key={worker.id} className="border-t border-black/10 align-top">
              <td className="py-3">
                <Link className="font-medium text-moss hover:underline" to={`/company/workers/${worker.id}`}>
                  {worker.full_name}
                </Link>
                <div className="text-xs text-black/50">{worker.phone}</div>
              </td>
              <td className="py-3">{worker.external_worker_id}</td>
              <td className="py-3">
                <div>{String(worker.attributes.role ?? "delivery")}</div>
                <div className="mt-1 text-xs text-black/50">{String(worker.attributes.company ?? "company")}</div>
              </td>
              <td className="py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs capitalize ${
                    worker.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {worker.status}
                </span>
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <button
                    className="rounded-full bg-moss px-3 py-2 text-xs text-white"
                    onClick={() => onIssueCredential(worker)}
                  >
                    Issue credential
                  </button>
                  <button
                    className="rounded-full bg-ember px-3 py-2 text-xs text-white disabled:opacity-50"
                    disabled={busyWorkerId === worker.id}
                    onClick={() => onRevokeWorker(worker.id)}
                  >
                    Revoke
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
